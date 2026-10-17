import { Component, computed, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';
import { ProfileSentinel } from '../../sentinels/profile.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { Availability, Appointment } from '../../models/wellspace.model';
import { TherapistProfile } from '../../models/therapist-profile.model';
import { TherapistAppointmentCard } from '../therapist-appointment-card/therapist-appointment-card';

@Component({
  selector: 'app-therapist-home',
  imports: [RouterLink, RouterOutlet, TherapistAppointmentCard],
  templateUrl: './therapist-home.html',
  styleUrl: './therapist-home.css',
})
export class TherapistHome {
  private auth = inject(AuthSentinel);
  private availability = inject(AvailabilitySentinel);
  private profileSentinel = inject(ProfileSentinel);
  private booking = inject(BookingSentinel);
  private router = inject(Router);

  account = toSignal(this.auth.account$, { initialValue: null });

  week = toSignal<Availability | null | undefined>(this.availability.observe(), {
    initialValue: null,
  });

  profile = toSignal<TherapistProfile | null | undefined>(this.profileSentinel.observe(), {
    initialValue: null,
  });

  appointments = toSignal<Appointment[] | null>(this.booking.forTherapist('ava'), {
    initialValue: null,
  });

  upcoming = computed(() =>
    (this.appointments() ?? [])
      .filter(
        (item) => item.status === 'booked' && new Date(`${item.date}T${item.time}`) >= new Date(),
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
  );

  cancelled = computed(() =>
    (this.appointments() ?? []).filter((item) => item.status === 'cancelled'),
  );

  scheduleMessageControl = new FormControl('', { nonNullable: true });
  scheduleMessage = toSignal(this.scheduleMessageControl.valueChanges, { initialValue: '' });

  messageControl = new FormControl('', { nonNullable: true });
  message = toSignal(this.messageControl.valueChanges, { initialValue: '' });

  async initializeProfile() {
    try {
      await this.profileSentinel.initialize();
      this.messageControl.setValue("Ava's profile is ready.");
    } catch {
      this.messageControl.setValue('Could not initialize the profile.');
    }
  }

  async seedSchedule() {
    try {
      await this.availability.initializeDemoWeek();
      this.scheduleMessageControl.setValue('Weekly schedule is ready.');
    } catch {
      this.scheduleMessageControl.setValue('Unable to seed the schedule.');
    }
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
