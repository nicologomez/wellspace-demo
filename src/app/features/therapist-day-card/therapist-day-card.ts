import { Component, input, output } from '@angular/core';
import { DaySchedule } from '../../models/wellspace.model';

@Component({
  selector: 'app-therapist-day-card',
  imports: [],
  templateUrl: './therapist-day-card.html',
  styleUrl: './therapist-day-card.css',
})
export class TherapistDayCard {
  name = input.required<string>();
  schedule = input<DaySchedule | undefined>();
  active = input(false);
  choose = output<string>();
}
