import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSentinel } from '../../sentinels/auth.sentinel';
import { TherapistCard } from '../therapist-card/therapist-card';
import { SessionRow } from '../session-row/session-row';
import { FOCUS_AREAS, THERAPISTS } from '../../data/demo-data';
import { searchTherapists, SortBy } from '../../helpers/client.helpers';
import { SavedSentinel } from '../../sentinels/saved.sentinel';
import { BookingSentinel } from '../../sentinels/booking.sentinel';
import { Appointment } from '../../models/wellspace.model';

@Component({
  selector: 'app-client-dashboard',
  imports: [RouterOutlet, RouterLink, TherapistCard, SessionRow, ReactiveFormsModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css',
})
export class ClientDashboard {
  private auth = inject(AuthSentinel);
  private saved = inject(SavedSentinel);
  private booking = inject(BookingSentinel);
  private router = inject(Router);

  account = toSignal(this.auth.account$, { initialValue: null });
  savedIds = toSignal<string[] | null>(this.saved.list(this.auth.currentUid()), {
    initialValue: null,
  });
  bookings = toSignal<Appointment[] | null>(this.booking.forClient(this.auth.currentUid()), {
    initialValue: null,
  });

  upcoming = computed(() =>
    (this.bookings() ?? [])
      .filter(
        (item) => item.status === 'booked' && new Date(`${item.date}T${item.time}`) >= new Date(),
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
  );

  cancelled = computed(() => (this.bookings() ?? []).filter((s) => s.status === 'cancelled'));

  focusAreas = FOCUS_AREAS;
  searchControl = new FormControl('', { nonNullable: true });
  focusControl = new FormControl('', { nonNullable: true });
  formatControl = new FormControl('', { nonNullable: true });
  sortControl = new FormControl<SortBy>('name', { nonNullable: true });
  tabControl = new FormControl('all', { nonNullable: true });

  search = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  focus = toSignal(this.focusControl.valueChanges, { initialValue: '' });
  format = toSignal(this.formatControl.valueChanges, { initialValue: '' });
  sort = toSignal(this.sortControl.valueChanges, { initialValue: 'name' as SortBy });
  tab = toSignal(this.tabControl.valueChanges, { initialValue: 'all' });

  therapists = computed(() =>
    searchTherapists(
      THERAPISTS,
      this.search(),
      this.focus(),
      this.format(),
      this.sort(),
      this.tab() === 'saved',
      this.savedIds() ?? [],
    ),
  );

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  async toggleSaved(id: string) {
    if (this.savedIds() === null) return;
    await this.saved.toggle(this.auth.currentUid(), id, this.savedIds()!);
  }
}
