import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../models/wellspace.model';

@Component({
  selector: 'app-therapist-appointment-card',
  imports: [RouterLink],
  templateUrl: './therapist-appointment-card.html',
  styleUrl: './therapist-appointment-card.css',
})
export class TherapistAppointmentCard {
  appointment = input.required<Appointment>();
}
