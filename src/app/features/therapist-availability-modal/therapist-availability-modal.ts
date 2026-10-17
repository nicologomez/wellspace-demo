import { Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { Availability, DaySchedule } from '../../models/wellspace.model';
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';
import { WEEK_DAYS, emptyDay, validDay, weeklyHours } from '../../helpers/therapist.helpers';
import { TherapistDayCard } from '../therapist-day-card/therapist-day-card';

@Component({
  selector: 'app-therapist-availability-modal',
  imports: [RouterLink, ReactiveFormsModule, TherapistDayCard],
  templateUrl: './therapist-availability-modal.html',
  styleUrl: './therapist-availability-modal.css',
})
export class TherapistAvailabilityModal implements OnInit {
  private availability = inject(AvailabilitySentinel);
  private fb = inject(FormBuilder);

  week = toSignal<Availability | null | undefined>(this.availability.observe(), {
    initialValue: null,
  });
  days = WEEK_DAYS;
  dayControl = new FormControl('Monday', { nonNullable: true });
  day = toSignal(this.dayControl.valueChanges, { initialValue: 'Monday' });
  hours = computed(() => (this.week() ? weeklyHours(this.week()!) : 0));
  totalSlots = computed(() =>
    Object.values(this.week()?.days ?? {}).reduce(
      (total, item) => total + (item.enabled ? item.slots : 0),
      0,
    ),
  );

  // Single FormGroup: typing remains intact during background profile/week updates.
  form = this.fb.nonNullable.group({
    enabled: [false],
    start: ['09:00', Validators.required],
    end: ['18:00', Validators.required],
    breakStart: ['12:00', Validators.required],
    breakEnd: ['13:00', Validators.required],
    slots: [0, [Validators.min(0), Validators.max(24)]],
  });

  noticeControl = new FormControl('', { nonNullable: true });
  notice = toSignal(this.noticeControl.valueChanges, { initialValue: '' });

  async ngOnInit() {
    const firstWeek = await firstValueFrom(
      this.availability.observe().pipe(
        filter((week): week is Availability => week !== undefined),
        take(1),
      ),
    );
    this.form.reset(firstWeek.days[this.day()] ?? emptyDay(this.day()));
  }

  chooseDay(day: string) {
    if (!this.days.includes(day) || day === this.day()) return;
    if (this.form.dirty && !confirm('Discard unsaved changes for this day?')) return;
    this.dayControl.setValue(day);
    this.form.reset(this.week()?.days[day] ?? emptyDay(day));
  }

  async save() {
    const value: DaySchedule = this.form.getRawValue();
    if (this.form.invalid || !validDay(value)) {
      this.noticeControl.setValue('Check work hours, break times, and slots.');
      return;
    }
    try {
      await this.availability.saveDay(this.day(), value);
      this.form.markAsPristine();
      this.noticeControl.setValue('Schedule updated.');
    } catch (error) {
      this.noticeControl.setValue((error as Error).message);
    }
  }

  async remove() {
    if (!confirm(`Remove ${this.day()} from your weekly schedule?`)) return;
    try {
      await this.availability.removeDay(this.day());
      this.form.reset(emptyDay(this.day()));
      this.noticeControl.setValue('Day removed from the schedule.');
    } catch (error) {
      this.noticeControl.setValue((error as Error).message);
    }
  }
}
