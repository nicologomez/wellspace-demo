export type Role = 'client' | 'therapist';
export type Format = 'Video' | 'Call' | 'In-Person';
export type Status = 'booked' | 'cancelled';

export interface Account {
  uid: string;
  username: string;
  displayName: string;
  role: Role;
}
export interface Therapist {
  id: string;
  name: string;
  credential: string;
  focusAreas: string[];
  formats: Format[];
  about: string;
  bookable: boolean;
}
export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  slots: number;
}
export interface Availability {
  therapistId: string;
  days: Record<string, DaySchedule>;
}
export interface Appointment {
  id: string;
  clientId: string;
  therapistId: string;
  date: string;
  time: string;
  format: Format;
  focusArea: string;
  context: string;
  status: Status;
  slotKey: string;
  createdAt: number;
  updatedAt: number;
}
export type NewAppointment = Omit<Appointment, 'id'>;
export interface SharedNote {
  id: string;
  appointmentId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  updatedAt: number;
}
