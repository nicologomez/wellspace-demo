import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { NoteSentinel } from '../../sentinels/note.sentinel';
import { ProfileSentinel } from '../../sentinels/profile.sentinel';
import { SharedNote } from '../../models/wellspace.model';
import { NoteCard } from '../note-card/note-card';

@Component({
  selector: 'app-therapist-session-modal',
  imports: [RouterLink, RouterOutlet, NoteCard],
  templateUrl: './therapist-session-modal.html',
  styleUrl: './therapist-session-modal.css',
})
export class TherapistSessionModal {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthSentinel);
  private booking = inject(BookingSentinel);
  private notes = inject(NoteSentinel);
  private profiles = inject(ProfileSentinel);

  id = this.route.snapshot.paramMap.get('id') ?? '';
  appointment = toSignal(this.booking.byId(this.id));
  profile = toSignal(this.profiles.observe());

  sharedNotes = toSignal<SharedNote[] | null>(this.notes.forSession(this.id), {
    initialValue: null,
  });

  currentUid = this.auth.currentUid();

  async removeNote(id: string) {
    if (!confirm('Delete this shared note?')) return;
    try {
      await this.notes.remove(id, this.currentUid);
    } catch {
      alert('Only the author can delete this note.');
    }
  }
}
