import { Routes } from '@angular/router';
import { clientGuard, therapistGuard } from './guards/role.guard';
import { Login } from './features/login/login';
import { ClientDashboard } from './features/client-dashboard/client-dashboard';
import { TherapistHome } from './features/therapist-home/therapist-home';
import { BookingModal } from './features/booking-modal/booking-modal';
import { RescheduleModal } from './features/reschedule-modal/reschedule-modal';
import { SessionModal } from './features/session-modal/session-modal';
import { NoteEditor } from './features/note-editor/note-editor';
import { CallModal } from './features/call-modal/call-modal';

import { TherapistProfileModal } from './features/therapist-profile-modal/therapist-profile-modal';
import { TherapistAvailabilityModal } from './features/therapist-availability-modal/therapist-availability-modal';
import { TherapistSessionModal } from './features/therapist-session-modal/therapist-session-modal';
import { TherapistNoteEditor } from './features/therapist-note-editor/therapist-note-editor';
import { TherapistCallModal } from './features/therapist-call-modal/therapist-call-modal';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'client',
    component: ClientDashboard,
    canActivate: [clientGuard],
    children: [
      { path: 'book/:therapistId', component: BookingModal },
      { path: 'reschedule/:id', component: RescheduleModal },
      {
        path: 'session/:id',
        component: SessionModal,
        children: [
          { path: 'note/new', component: NoteEditor },
          { path: 'note/:noteId/edit', component: NoteEditor },
        ],
      },
      { path: 'call/:id', component: CallModal },
    ],
  },
  {
    path: 'therapist',
    component: TherapistHome,
    canActivate: [therapistGuard],
    children: [
      { path: 'profile', component: TherapistProfileModal },
      { path: 'availability', component: TherapistAvailabilityModal },
      {
        path: 'session/:id',
        component: TherapistSessionModal,
        children: [
          { path: 'note/new', component: TherapistNoteEditor },
          { path: 'note/:noteId/edit', component: TherapistNoteEditor },
        ],
      },
      { path: 'call/:id', component: TherapistCallModal },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
