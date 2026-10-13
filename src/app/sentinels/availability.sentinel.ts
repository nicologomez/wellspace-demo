import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, getDoc, setDoc } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { Availability } from '../models/wellspace.model';
import { DEFAULT_AVAILABILITY } from '../data/demo-data';

@Injectable({ providedIn: 'root' })
export class AvailabilitySentinel {
  private db = inject(Firestore);
  private ref = doc(this.db, 'availability', 'ava');

  observe() {
    return docData(this.ref).pipe(map((data) => data as Availability | undefined));
  }

  async initializeDemoWeek() {
    const existing = await getDoc(this.ref);
    if (existing.exists()) return;
    await setDoc(this.ref, DEFAULT_AVAILABILITY);
  }
}
