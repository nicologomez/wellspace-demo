import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FOCUS_AREAS, THERAPISTS } from '../../data/demo-data';
import { nextDates, possibleTimes, slotId } from '../../helpers/client.helpers';
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { Availability, Format } from '../../models/wellspace.model';

@Component({
  selector: 'app-booking-modal',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.css',
})
export class BookingModal {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private availabilitySentinel = inject(AvailabilitySentinel);
  private booking = inject(BookingSentinel);
  private auth = inject(AuthSentinel);

  therapistId = this.route.snapshot.paramMap.get('therapistId') ?? 'ava';
  therapist = THERAPISTS.find((t) => t.id === this.therapistId)!;
  focusAreas = FOCUS_AREAS;
  dates = nextDates();

  form = this.fb.nonNullable.group({
    format: ['Video', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    focusArea: ['', Validators.required],
    context: [''],
  });

  errorControl = new FormControl('', { nonNullable: true });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });

  week = toSignal<Availability | undefined>(this.availabilitySentinel.observe(), {
    initialValue: undefined,
  });
  locks = toSignal<string[] | null>(this.booking.lockedIds(), {
    initialValue: null,
  });
  selectedDate = toSignal(this.form.controls.date.valueChanges, { initialValue: '' });

  availableTimes = computed(() => {
    const week = this.week();
    const locks = this.locks();
    if (!week || !locks || !this.selectedDate()) return [];
    return possibleTimes(this.selectedDate(), week).filter(
      (time) => !locks.includes(slotId(this.selectedDate(), time)),
    );
  });

  chooseDate(date: string) {
    this.form.controls.date.setValue(date);
    this.form.controls.time.setValue('');
  }

  async submit() {
    if (this.form.invalid || !this.therapist.bookable) return;
    const data = this.form.getRawValue();
    if (!this.availableTimes().includes(data.time)) {
      this.errorControl.setValue('Select a currently available time.');
      return;
    }
    try {
      await this.booking.create({
        ...data,
        format: data.format as Format,
        clientId: this.auth.currentUid(),
      });
      await this.router.navigate(['/client']);
    } catch (error) {
      this.errorControl.setValue((error as Error).message);
    }
  }
}
