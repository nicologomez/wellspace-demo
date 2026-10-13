import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { NoteSentinel } from '../../sentinels/note.sentinel';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { NoteCard } from '../note-card/note-card';
import { Appointment, SharedNote } from '../../models/wellspace.model';

@Component({
  selector: 'app-session-modal',
  imports: [RouterLink, RouterOutlet, NoteCard],
  templateUrl: './session-modal.html',
  styleUrl: './session-modal.css',
})
export class SessionModal {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private booking = inject(BookingSentinel);
  private notes = inject(NoteSentinel);
  private auth = inject(AuthSentinel);

  id = this.route.snapshot.paramMap.get('id') ?? '';

  appointment = toSignal<Appointment | undefined>(this.booking.byId(this.id), {
    initialValue: undefined,
  });

  sharedNotes = toSignal<SharedNote[] | null>(this.notes.forSession(this.id), {
    initialValue: null,
  });

  currentUid = this.auth.currentUid();

  messageControl = new FormControl('', { nonNullable: true });
  message = toSignal(this.messageControl.valueChanges, { initialValue: '' });

  async removeNote(id: string) {
    if (!confirm('Delete this shared note?')) return;
    try {
      await this.notes.remove(id, this.currentUid);
    } catch {
      alert('Only the author may delete this note.');
    }
  }

  async cancelSession() {
    if (!confirm('Cancel this session?')) return;
    try {
      await this.booking.cancel(this.id, this.currentUid);
    } catch (error) {
      this.messageControl.setValue((error as Error).message);
    }
  }

  async deleteSession() {
    if (!confirm('Permanently delete this cancelled session?')) return;
    try {
      await this.booking.deleteCancelled(this.id, this.currentUid);
      await this.router.navigate(['/client']);
    } catch (error) {
      this.messageControl.setValue((error as Error).message);
    }
  }
}
