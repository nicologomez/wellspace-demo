import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of, shareReplay, switchMap } from 'rxjs';
import { Account } from '../models/wellspace.model';

const EMAILS = (() => ({
  nichols: 'nichols@wellspace.demo',
  ava: 'ava@wellspace.demo',
}))();

@Injectable({ providedIn: 'root' })
export class AuthSentinel {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  account$ = authState(this.auth).pipe(
    switchMap((user) =>
      user
        ? (docData(doc(this.firestore, 'users', user.uid), {
            idField: 'uid',
          }) as Observable<Account>)
        : of(null),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  currentUid(): string {
    return this.auth.currentUser?.uid ?? '';
  }

  login(username: string, password: string) {
    const email = EMAILS[username.trim().toLowerCase() as keyof typeof EMAILS];
    if (!email) throw new Error('Use Nichols or Ava.');
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }
}
