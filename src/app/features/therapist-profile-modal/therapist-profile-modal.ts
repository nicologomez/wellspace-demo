import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, take } from 'rxjs';
import { ProfileSentinel } from '../../sentinels/profile.sentinel';
import { TherapistProfile } from '../../models/therapist-profile.model';
import { FOCUS_AREAS } from '../../data/demo-data';
import { Format } from '../../models/wellspace.model';

@Component({
  selector: 'app-therapist-profile-modal',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './therapist-profile-modal.html',
  styleUrl: './therapist-profile-modal.css',
})
export class TherapistProfileModal {
  private profiles = inject(ProfileSentinel);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // First real profile only; later Firestore emissions cannot replace unsaved typing.
  profile = toSignal<TherapistProfile | null>(
    this.profiles.observe().pipe(
      filter((value): value is TherapistProfile => value !== undefined),
      take(1),
    ),
    { initialValue: null },
  );

  focusAreas = FOCUS_AREAS;
  formats: Format[] = ['Video', 'Call', 'In-Person'];

  errorControl = new FormControl('', { nonNullable: true });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });

  form = computed(() =>
    this.fb.nonNullable.group({
      title: [
        this.profile()?.title ?? '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
      ],
      about: [this.profile()?.about ?? '', Validators.required],
      focusAreas: new FormControl<string[]>(this.profile()?.focusAreas ?? [], {
        nonNullable: true,
        validators: [Validators.required],
      }),
      formats: new FormControl<Format[]>(this.profile()?.formats ?? [], {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }),
  );

  hasFocus(area: string) {
    return this.form().controls.focusAreas.value.includes(area);
  }

  toggleFocus(area: string) {
    const control = this.form().controls.focusAreas;
    const next = this.hasFocus(area)
      ? control.value.filter((value) => value !== area)
      : [...control.value, area];
    control.setValue(next);
  }

  hasFormat(format: Format) {
    return this.form().controls.formats.value.includes(format);
  }

  toggleFormat(format: Format) {
    const control = this.form().controls.formats;
    const next = this.hasFormat(format)
      ? control.value.filter((value) => value !== format)
      : [...control.value, format];
    control.setValue(next);
  }

  async save() {
    if (this.form().invalid) return;
    try {
      await this.profiles.save(this.form().getRawValue());
      await this.router.navigate(['/therapist']);
    } catch (error) {
      this.errorControl.setValue((error as Error).message);
    }
  }
}
