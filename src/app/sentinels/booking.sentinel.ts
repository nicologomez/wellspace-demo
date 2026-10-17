import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  where,
  runTransaction,
  getDoc,
  getDocs,
  deleteDoc,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Format, NewAppointment, Availability, Appointment } from '../models/wellspace.model';
import { TherapistProfile } from '../models/therapist-profile.model';
import { possibleTimes, slotId } from '../helpers/client.helpers';
import { allowedChoice } from '../helpers/profile.helpers';

@Injectable({ providedIn: 'root' })
export class BookingSentinel {
  // Inject the database connection
  private db = inject(Firestore);

  // [CRUD - R: READ]
  // READ (Nichols)- Streams all appointments belonging to this client
  forClient(uid: string): Observable<Appointment[]> {
    const q = query(collection(this.db, 'appointments'), where('clientId', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
  }

  // READ (Ava)- Streams all appointments for the therapist dashboard
  forTherapist(therapistId = 'ava'): Observable<Appointment[]> {
    const q = query(collection(this.db, 'appointments'), where('therapistId', '==', therapistId));
    return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
  }

  // READ- Streams list of already-booked slot IDs
  lockedIds(): Observable<string[]> {
    return collectionData(collection(this.db, 'bookedSlots'), { idField: 'id' }).pipe(
      map((rows) => rows.map((row) => row['id'] as string)),
    );
  }

  // READ ONE- Streams one specific appointment by its document ID

  byId(id: string): Observable<Appointment | undefined> {
    return docData(doc(this.db, 'appointments', id), { idField: 'id' }).pipe(
      map((data) => data as Appointment | undefined),
    );
  }

  // [CRUD - C: CREATE] Nichols books a new therapy session with Ava
  async create(input: {
    clientId: string;
    date: string;
    time: string;
    format: Format;
    focusArea: string;
    context: string;
  }) {
    const appointmentRef = doc(collection(this.db, 'appointments'));
    const key = slotId(input.date, input.time);
    const lockRef = doc(this.db, 'bookedSlots', key);
    const scheduleRef = doc(this.db, 'availability', 'ava');
    const profileRef = doc(this.db, 'therapists', 'ava');

    return runTransaction(this.db, async (tx) => {
      const schedule = await tx.get(scheduleRef);
      const occupied = await tx.get(lockRef);
      const profile = await tx.get(profileRef);

      if (!schedule.exists()) throw Error('Ava has no schedule yet.');
      if (!profile.exists()) throw Error('Ava’s profile is unavailable.');

      const ava = profile.data() as TherapistProfile;
      if (!allowedChoice(ava, input.format, input.focusArea)) {
        throw Error('Ava no longer offers that format or focus area.');
      }

      if (!possibleTimes(input.date, schedule.data() as Availability).includes(input.time)) {
        throw Error('That time is outside Ava’s availability.');
      }
      if (occupied.exists()) {
        throw Error('This slot was already booked.');
      }

      const now = Date.now();
      const appointment: NewAppointment = {
        ...input,
        therapistId: 'ava',
        status: 'booked',
        slotKey: key,
        createdAt: now,
        updatedAt: now,
      };

      tx.set(appointmentRef, appointment);
      tx.set(lockRef, {
        appointmentId: appointmentRef.id,
        clientId: input.clientId,
        therapistId: 'ava',
      });

      return appointmentRef.id;
    });
  }

  // [CRUD - U: UPDATE] Nichols reschedules a booked session
  async reschedule(
    id: string,
    uid: string,
    date: string,
    time: string,
    format: Format,
    focusArea: string,
    context: string,
  ) {
    const appointmentRef = doc(this.db, 'appointments', id);
    const scheduleRef = doc(this.db, 'availability', 'ava');
    const profileRef = doc(this.db, 'therapists', 'ava');
    const key = slotId(date, time);

    return runTransaction(this.db, async (tx) => {
      const existing = await tx.get(appointmentRef);
      const schedule = await tx.get(scheduleRef);
      const profile = await tx.get(profileRef);

      if (!existing.exists() || !schedule.exists()) throw Error('Session or schedule missing.');
      if (!profile.exists()) throw Error('Ava’s profile is unavailable.');

      if (!allowedChoice(profile.data() as TherapistProfile, format, focusArea)) {
        throw Error('Choose Ava’s currently offered format and focus area.');
      }

      const old = existing.data() as Appointment;
      if (old.clientId !== uid || old.status !== 'booked') throw Error('Cannot reschedule.');
      if (!possibleTimes(date, schedule.data() as Availability).includes(time)) {
        throw Error('The new time is unavailable.');
      }

      if (key !== old.slotKey) {
        const lockRef = doc(this.db, 'bookedSlots', key);
        if ((await tx.get(lockRef)).exists()) throw Error('The new slot is occupied.');
        tx.delete(doc(this.db, 'bookedSlots', old.slotKey));
        tx.set(lockRef, { appointmentId: id, clientId: uid, therapistId: 'ava' });
      }

      tx.update(appointmentRef, {
        date,
        time,
        format,
        focusArea,
        context,
        slotKey: key,
        updatedAt: Date.now(),
      });
    });
  }

  // [CRUD - D: DELETE] Nichols cancels or deletes an appointment

  async cancel(id: string, uid: string) {
    const ref = doc(this.db, 'appointments', id);
    return runTransaction(this.db, async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw Error('Session not found.');
      const old = snapshot.data() as Appointment;
      if (old.clientId !== uid || old.status !== 'booked') return;

      tx.delete(doc(this.db, 'bookedSlots', old.slotKey));
      tx.update(ref, { status: 'cancelled', updatedAt: Date.now() });
    });
  }

  async deleteCancelled(id: string, uid: string) {
    const ref = doc(this.db, 'appointments', id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw Error('Session not found.');
    const appointment = snapshot.data() as Appointment;

    if (appointment.clientId !== uid || appointment.status !== 'cancelled') {
      throw Error('Cancel the session before deleting it.');
    }

    const notes = await getDocs(
      query(collection(this.db, 'sharedNotes'), where('appointmentId', '==', id)),
    );
    if (!notes.empty) throw Error('Remove linked shared notes before deletion.');

    return deleteDoc(ref);
  }
}
