import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom, filter, take } from 'rxjs';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { Account } from '../../models/wellspace.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthSentinel);
  private router = inject(Router);
  errorControl = new FormControl('', { nonNullable: true });
  error = toSignal(this.errorControl.valueChanges, { initialValue: '' });
  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  async submit() {
    if (this.form.invalid) return;
    this.errorControl.setValue('');
    try {
      const { username, password } = this.form.getRawValue();
      await this.auth.login(username, password);
      const account = await firstValueFrom(
        this.auth.account$.pipe(
          filter((a): a is Account => !!a && 'role' in a),
          take(1),
        ),
      );
      await this.router.navigate([account.role === 'client' ? '/client' : '/therapist']);
    } catch {
      this.errorControl.setValue('Check the username, password, and user document.');
    }
  }
}
