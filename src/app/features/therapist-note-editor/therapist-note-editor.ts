import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, of, take } from 'rxjs';
import { Account, SharedNote } from '../../models/wellspace.model';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { NoteSentinel } from '../../sentinels/note.sentinel';

@Component({
  selector: 'app-therapist-note-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './therapist-note-editor.html',
  styleUrl: './therapist-note-editor.css',
})
export class TherapistNoteEditor {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthSentinel);
  private notes = inject(NoteSentinel);
  sessionId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
  editId = this.route.snapshot.paramMap.get('noteId');
  account = toSignal(this.auth.account$);
  // For editing, freeze the first real snapshot so background updates cannot
  // reconstruct the draft form during typing.
  original = toSignal<SharedNote | undefined>(
    this.editId
      ? this.notes.byId(this.editId).pipe(
          filter((note): note is SharedNote => note !== undefined),
          take(1),
        )
      : of(undefined),
  );
  errorControl = new FormControl('', { nonNullable: true });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });
  form = computed(() =>
    this.fb.nonNullable.group({
      title: [this.original()?.title ?? '', [Validators.required, Validators.maxLength(120)]],
      body: [this.original()?.body ?? '', Validators.required],
    }),
  );

  async save() {
    const account = this.account() as Account | null | undefined;
    if (!account || !this.sessionId || this.form().invalid) return;
    if (
      this.editId &&
      (this.original()?.authorId !== account.uid ||
        this.original()?.appointmentId !== this.sessionId)
    ) {
      this.errorControl.setValue('This note cannot be edited in this session.');
      return;
    }
    const { title, body } = this.form().getRawValue();
    try {
      await this.persist(account, title, body);
      await this.router.navigate(['/therapist/session', this.sessionId]);
    } catch (error) {
      this.errorControl.setValue((error as Error).message);
    }
  }

  private persist(account: Account, title: string, body: string) {
    if (this.editId) return this.notes.update(this.editId, account.uid, title, body);
    return this.notes.create(this.sessionId, title, body, account.uid, account.displayName);
  }
}
