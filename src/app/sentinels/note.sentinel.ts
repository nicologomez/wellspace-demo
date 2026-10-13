import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  where,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { SharedNote } from '../models/wellspace.model';

@Injectable({ providedIn: 'root' })
export class NoteSentinel {
  private db = inject(Firestore);

  forSession(appointmentId: string): Observable<SharedNote[]> {
    const q = query(
      collection(this.db, 'sharedNotes'),
      where('appointmentId', '==', appointmentId),
    );
    return collectionData(q, { idField: 'id' }) as Observable<SharedNote[]>;
  }

  byId(id: string): Observable<SharedNote | undefined> {
    return docData(doc(this.db, 'sharedNotes', id), { idField: 'id' }).pipe(
      map((data) => data as SharedNote | undefined),
    );
  }

  create(appointmentId: string, title: string, body: string, authorId: string, authorName: string) {
    return addDoc(collection(this.db, 'sharedNotes'), {
      appointmentId,
      title,
      body,
      authorId,
      authorName,
      updatedAt: Date.now(),
    });
  }

  async update(id: string, uid: string, title: string, body: string) {
    const ref = doc(this.db, 'sharedNotes', id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists() || snapshot.data()['authorId'] !== uid) {
      throw Error('Only the note author can edit it.');
    }
    return updateDoc(ref, { title, body, updatedAt: Date.now() });
  }

  async remove(id: string, uid: string) {
    const ref = doc(this.db, 'sharedNotes', id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists() || snapshot.data()['authorId'] !== uid) {
      throw Error('Only the note author can delete it.');
    }
    return deleteDoc(ref);
  }
}
