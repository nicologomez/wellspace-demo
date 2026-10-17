import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FOCUS_AREAS, THERAPISTS } from '../../data/demo-data';
import { nextDates, possibleTimes, slotId } from '../../helpers/client.helpers';
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { ProfileSentinel } from '../../sentinels/profile.sentinel';
import { Availability, Format } from '../../models/wellspace.model';
import { TherapistProfile } from '../../models/therapist-profile.model';
import { allowedChoice } from '../../helpers/profile.helpers';

@Component({
  selector: 'app-booking-modal',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.css',
})
export class BookingModal {
  // Services & Routing
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private availabilitySentinel = inject(AvailabilitySentinel);
  private booking = inject(BookingSentinel);
  private auth = inject(AuthSentinel);
  private profiles = inject(ProfileSentinel);

  // Target Therapist (Ava)
  therapistId = this.route.snapshot.paramMap.get('therapistId') ?? 'ava';
  therapist = THERAPISTS.find((t) => t.id === this.therapistId)!;

  // Stream Ava's live profile to keep specialties and formats current
  avaProfile = toSignal<TherapistProfile | null | undefined>(this.profiles.observe(), {
    initialValue: null,
  });

  viewProfile = computed(() =>
    this.therapistId === 'ava' ? (this.avaProfile() ?? this.therapist) : this.therapist,
  );

  canBook = computed(() => this.therapistId === 'ava' && !!this.avaProfile());

  focusAreas = FOCUS_AREAS;
  dates = nextDates();

  // [C in CRUD] 1. The Reactive Form (Clipboard for User Input)
  form = this.fb.nonNullable.group({
    format: ['Video', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    focusArea: ['', Validators.required],
    context: [''],
  });

  // Track field changes for real-time validation
  selectedFormat = toSignal(this.form.controls.format.valueChanges, {
    initialValue: this.form.controls.format.value,
  });
  selectedFocus = toSignal(this.form.controls.focusArea.valueChanges, {
    initialValue: this.form.controls.focusArea.value,
  });
  validOptions = computed(() =>
    allowedChoice(
      this.avaProfile() ?? undefined,
      this.selectedFormat() as Format,
      this.selectedFocus(),
    ),
  );

  errorControl = new FormControl('', { nonNullable: true });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });

  // Stream weekly hours & occupied slots to calculate open times
  week = toSignal<Availability | undefined>(this.availabilitySentinel.observe(), {
    initialValue: undefined,
  });
  locks = toSignal<string[] | null>(this.booking.lockedIds(), {
    initialValue: null,
  });
  selectedDate = toSignal(this.form.controls.date.valueChanges, { initialValue: '' });

  // Derived signal: calculates open times for the selected day
  availableTimes = computed(() => {
    const week = this.week();
    const locks = this.locks();
    if (!week || !locks || !this.selectedDate()) return [];
    return possibleTimes(this.selectedDate(), week).filter(
      (time) => !locks.includes(slotId(this.selectedDate(), time)),
    );
  });

  // Helper when clicking a date button in the UI
  chooseDate(date: string) {
    this.form.controls.date.setValue(date);
    this.form.controls.time.setValue(''); // Reset time choice when date changes
  }

  // [C in CRUD] 2. Submit Handler (Sends data to Micro-Worker)
  async submit() {
    if (this.form.invalid || !this.therapist.bookable) return;

    if (!this.validOptions()) {
      this.errorControl.setValue('Please select Ava’s current offerings.');
      return;
    }

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
