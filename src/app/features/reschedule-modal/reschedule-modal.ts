import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Sentinels
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { ProfileSentinel } from '../../sentinels/profile.sentinel';

// Models & Data Helpers
import { Appointment, Availability, Format } from '../../models/wellspace.model';
import { TherapistProfile } from '../../models/therapist-profile.model';
import { FOCUS_AREAS } from '../../data/demo-data';
import { nextDates, possibleTimes, slotId } from '../../helpers/client.helpers';
import { allowedChoice } from '../../helpers/profile.helpers';

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
  private profiles = inject(ProfileSentinel);

  // [CRUD - U: STEP 1] Read Document Identity & Fetch Existing Data
  id = this.route.snapshot.paramMap.get('id') ?? '';
  appointment = toSignal<Appointment | undefined>(this.booking.byId(this.id));

  // Stream Ava's weekly working schedule and currently locked time slots
  week = toSignal<Availability | undefined>(this.availability.observe());
  locks = toSignal<string[] | null>(this.booking.lockedIds(), { initialValue: null });

  // Stream Ava's live profile to keep offered formats and specialties up-to-date
  avaProfile = toSignal<TherapistProfile | null | undefined>(this.profiles.observe(), {
    initialValue: null,
  });

  dates = nextDates();
  focusAreas = FOCUS_AREAS;

  // [CRUD - U: STEP 2] Reactive Form Controls for the Updated Fields
  dateControl = new FormControl('', { nonNullable: true, validators: Validators.required });
  timeControl = new FormControl('', { nonNullable: true, validators: Validators.required });
  formatControl = new FormControl('', { nonNullable: true });
  focusControl = new FormControl('', { nonNullable: true });
  contextControl = new FormControl('', { nonNullable: true });
  errorControl = new FormControl('', { nonNullable: true });

  // Track field changes as signals for real-time template updates
  date = toSignal(this.dateControl.valueChanges, { initialValue: '' });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });
  chosenFormat = toSignal(this.formatControl.valueChanges, { initialValue: '' });
  chosenFocus = toSignal(this.focusControl.valueChanges, { initialValue: '' });

  // Validate that the updated choices match Ava's current offerings
  validOptions = computed(() => {
    const old = this.appointment();
    if (!old) return false;
    return allowedChoice(
      this.avaProfile() ?? undefined,
      (this.chosenFormat() || old.format) as Format,
      this.chosenFocus() || old.focusArea,
    );
  });

  // Calculate open times for the chosen date (ignoring current session's own slot key)
  times = computed(() => {
    if (!this.week() || !this.date() || !this.locks()) return [];
    return possibleTimes(this.date(), this.week()!).filter(
      (time) =>
        !this.locks()!.includes(slotId(this.date(), time)) ||
        slotId(this.date(), time) === this.appointment()?.slotKey,
    );
  });

  // Helper when clicking a date button in the modal
  chooseDate(date: string) {
    this.dateControl.setValue(date);
    this.timeControl.setValue(''); // Reset time when date changes
  }

  // [CRUD - U: STEP 3] Submit Handler (Sends changes to BookingSentinel)
  async save() {
    const old = this.appointment();
    // Guard clause: stop if form is invalid or session data is missing
    if (!old || this.dateControl.invalid || this.timeControl.invalid) return;

    if (!this.validOptions()) {
      this.errorControl.setValue('Choose Ava’s currently offered format and focus area.');
      return;
    }

    if (!this.times().includes(this.timeControl.value)) return;

    try {
      // Send the updated date, time, and choices to the micro-worker
      await this.booking.reschedule(
        old.id,
        this.auth.currentUid(),
        this.dateControl.value,
        this.timeControl.value,
        (this.formatControl.value || old.format) as Format,
        this.focusControl.value || old.focusArea,
        this.contextControl.value || old.context,
      );

      // Navigate back to the session details page to see updated time
      await this.router.navigate(['/client/session', old.id]);
    } catch (error) {
      this.errorControl.setValue((error as Error).message);
    }
  }
}
