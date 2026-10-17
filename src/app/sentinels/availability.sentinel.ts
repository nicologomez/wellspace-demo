import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  getDoc,
  setDoc,
  runTransaction,
  deleteField,
} from '@angular/fire/firestore';
import { map } from 'rxjs';
import { Availability, DaySchedule } from '../models/wellspace.model';
import { DEFAULT_AVAILABILITY } from '../data/demo-data';
import { WEEK_DAYS, validDay } from '../helpers/therapist.helpers';
import { nextDates, possibleTimes, slotId } from '../helpers/client.helpers';

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

  saveDay(day: string, value: DaySchedule) {
    return this.changeDay(day, value);
  }

  removeDay(day: string) {
    return this.changeDay(day, null);
  }

  private async changeDay(day: string, value: DaySchedule | null) {
    if (!WEEK_DAYS.includes(day)) throw Error('Unknown weekday.');
    if (value && !validDay(value)) throw Error('Invalid daily hours or slot limit.');

    return runTransaction(this.db, async (tx) => {
      const saved = await tx.get(this.ref);
      if (!saved.exists()) throw Error('Initialize weekly availability first.');

      const oldWeek = saved.data() as Availability;
      const days = { ...oldWeek.days };
      if (value) days[day] = value;
      else delete days[day];
      const changedWeek: Availability = { ...oldWeek, days };

      // Client v2 exposes exactly the next 14 dates for booking.
      for (const date of nextDates(14)) {
        const weekday = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
          weekday: 'long',
        });
        if (weekday !== day) continue;

        const after = possibleTimes(date, changedWeek);
        const removedStarts = possibleTimes(date, oldWeek).filter((time) => !after.includes(time));

        // All transaction reads happen before the single update below.
        for (const time of removedStarts) {
          const key = slotId(date, time);
          const booked = await tx.get(doc(this.db, 'bookedSlots', key));
          if (booked.exists()) {
            throw Error('Existing appointments depend on those hours.');
          }
        }
      }

      if (value) tx.update(this.ref, { [`days.${day}`]: value });
      else tx.update(this.ref, { [`days.${day}`]: deleteField() });
    });
  }
}
