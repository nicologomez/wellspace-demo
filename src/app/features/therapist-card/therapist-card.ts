import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Therapist } from '../../models/wellspace.model';
@Component({
  selector: 'app-therapist-card',
  imports: [RouterLink],
  templateUrl: './therapist-card.html',
  styleUrl: './therapist-card.css',
})
export class TherapistCard {
  therapist = input.required<Therapist>();
  saved = input(false);
  toggleSaved = output<string>();
}
