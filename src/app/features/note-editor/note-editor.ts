import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { Account, SharedNote } from '../../models/wellspace.model';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { NoteSentinel } from '../../sentinels/note.sentinel';

@Component({
  selector: 'app-note-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './note-editor.html',
  styleUrl: './note-editor.css',
})
export class NoteEditor {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthSentinel);
  private notes = inject(NoteSentinel);

  sessionId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
  editId = this.route.snapshot.paramMap.get('noteId');

  account = toSignal(this.auth.account$);
  original = toSignal<SharedNote | undefined>(
    this.editId ? this.notes.byId(this.editId) : of(undefined),
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
    const { title, body } = this.form().getRawValue();
    try {
      await this.persist(account, title, body);
      await this.router.navigate(['/client/session', this.sessionId]);
    } catch (error) {
      this.errorControl.setValue((error as Error).message);
    }
  }

  private persist(account: Account, title: string, body: string) {
    if (this.editId) {
      return this.notes.update(this.editId, account.uid, title, body);
    }
    return this.notes.create(this.sessionId, title, body, account.uid, account.displayName);
  }
}
