import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { TherapistProfile, ProfileChanges } from '../models/therapist-profile.model';
import { DEFAULT_AVA_PROFILE } from '../data/ava-profile';
import { FOCUS_AREAS } from '../data/demo-data';
import { Format } from '../models/wellspace.model';

@Injectable({ providedIn: 'root' })
export class ProfileSentinel {
  private db = inject(Firestore);
  private ref = doc(this.db, 'therapists', 'ava');

  observe(): Observable<TherapistProfile | undefined> {
    return docData(this.ref).pipe(map((value) => value as TherapistProfile | undefined));
  }

  async initialize() {
    const snapshot = await getDoc(this.ref);
    if (snapshot.exists()) return;
    await setDoc(this.ref, DEFAULT_AVA_PROFILE);
  }

  async save(changes: ProfileChanges) {
    const title = changes.title.trim();
    const about = changes.about.trim();
    if (title.length < 3 || title.length > 120 || !about)
      throw Error('Enter a title of 3–120 characters and a description.');
    if (!changes.focusAreas.length || !changes.formats.length)
      throw Error('Choose at least one specialty and format.');
    if (changes.focusAreas.some((area) => !FOCUS_AREAS.includes(area)))
      throw Error('Unknown focus area.');
    if (
      changes.formats.some(
        (format) => !(['Video', 'Call', 'In-Person'] as Format[]).includes(format),
      )
    )
      throw Error('Unknown session format.');
    await updateDoc(this.ref, { ...changes, title, about });
  }
}
