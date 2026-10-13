import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { AvailabilitySentinel } from '../../sentinels/availability.sentinel';

@Component({
  selector: 'app-therapist-home',
  imports: [],
  templateUrl: './therapist-home.html',
  styleUrl: './therapist-home.css',
})
export class TherapistHome {
  private auth = inject(AuthSentinel);
  private availability = inject(AvailabilitySentinel);
  private router = inject(Router);

  messageControl = new FormControl('', { nonNullable: true });
  message = toSignal(this.messageControl.valueChanges, { initialValue: '' });

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  async seedSchedule() {
    try {
      await this.availability.initializeDemoWeek();
      this.messageControl.setValue('Weekly demo schedule is ready.');
    } catch {
      this.messageControl.setValue('Could not initialize the schedule.');
    }
  }
}
