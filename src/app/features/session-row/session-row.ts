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
  // [CRUD - R: READ] Receives each individual appointment document as a Signal Input
  appointment = input.required<Appointment>();
}
