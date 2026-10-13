import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../models/wellspace.model';

@Component({
  selector: 'app-session-row',
  imports: [RouterLink],
  templateUrl: './session-row.html',
  styleUrl: './session-row.css',
})
export class SessionRow {
  appointment = input.required<Appointment>();
}
