import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SavedSentinel {
  private db = inject(Firestore);
  list(uid: string): Observable<string[]> {
    const ref = collection(this.db, 'users', uid, 'savedTherapists');
    return collectionData(ref, { idField: 'id' }).pipe(
      map((items) => items.map((item) => item['id'] as string)),
    );
  }
  async toggle(uid: string, id: string, savedIds: string[]) {
    const ref = doc(this.db, 'users', uid, 'savedTherapists', id);
    if (savedIds.includes(id)) return deleteDoc(ref);
    return setDoc(ref, { savedAt: Date.now() });
  }
}
