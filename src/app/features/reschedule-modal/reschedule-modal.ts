import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { Appointment, Availability, Format } from '../../models/wellspace.model';
import { FOCUS_AREAS } from '../../data/demo-data';
import { nextDates, possibleTimes, slotId } from '../../helpers/client.helpers';

@Component({
  selector: 'app-reschedule-modal',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reschedule-modal.html',
  styleUrl: './reschedule-modal.css',
})
export class RescheduleModal {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private booking = inject(BookingSentinel);
  private availability = inject(AvailabilitySentinel);
  private auth = inject(AuthSentinel);

  id = this.route.snapshot.paramMap.get('id') ?? '';
  appointment = toSignal<Appointment | undefined>(this.booking.byId(this.id));
  week = toSignal<Availability | undefined>(this.availability.observe());
  locks = toSignal<string[] | null>(this.booking.lockedIds(), { initialValue: null });

  dates = nextDates();
  focusAreas = FOCUS_AREAS;

  dateControl = new FormControl('', { nonNullable: true, validators: Validators.required });
  timeControl = new FormControl('', { nonNullable: true, validators: Validators.required });
  formatControl = new FormControl('', { nonNullable: true });
  focusControl = new FormControl('', { nonNullable: true });
  contextControl = new FormControl('', { nonNullable: true });
  errorControl = new FormControl('', { nonNullable: true });

  date = toSignal(this.dateControl.valueChanges, { initialValue: '' });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });

  times = computed(() => {
    if (!this.week() || !this.date() || !this.locks()) return [];
    return possibleTimes(this.date(), this.week()!).filter(
      (time) =>
        !this.locks()!.includes(slotId(this.date(), time)) ||
        slotId(this.date(), time) === this.appointment()?.slotKey,
    );
  });

  chooseDate(date: string) {
    this.dateControl.setValue(date);
    this.timeControl.setValue('');
  }

  async save() {
    const old = this.appointment();
    if (!old || this.dateControl.invalid || this.timeControl.invalid) return;
    if (!this.times().includes(this.timeControl.value)) return;

    try {
      await this.booking.reschedule(
        old.id,
        this.auth.currentUid(),
        this.dateControl.value,
        this.timeControl.value,
        (this.formatControl.value || old.format) as Format,
        this.focusControl.value || old.focusArea,
        this.contextControl.value || old.context,
      );
      await this.router.navigate(['/client/session', old.id]);
    } catch (error) {
      this.errorControl.setValue((error as Error).message);
    }
  }
}
