import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SharedNote } from '../../models/wellspace.model';

@Component({
  selector: 'app-note-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './note-card.html',
  styleUrl: './note-card.css',
})
export class NoteCard {
  note = input.required<SharedNote>();
  viewerUid = input.required<string>();
  remove = output<string>();
}
