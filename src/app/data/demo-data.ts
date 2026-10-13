import { Availability, Format, Therapist } from '../models/wellspace.model';

export const FOCUS_AREAS = (() => [
  'Anxiety',
  'Work-Life',
  'Grief',
  'Depression',
  'Burnout',
  'Career',
  'Trauma',
  'Relationships',
  'Life Transitions',
  'Stress',
])();

export const THERAPISTS: Therapist[] = (() => [
  {
    id: 'ava',
    name: 'Ava Smith',
    credential: 'Licensed Psychologist, PhD',
    focusAreas: ['Burnout', 'Stress', 'Relationships', 'Work-Life'],
    formats: ['Video', 'Call', 'In-Person'],
    bookable: true,
    about: 'Helping adults navigate change with more clarity.',
  },
  {
    id: 'noah',
    name: 'Noah Davis',
    credential: 'Licensed Professional Counselor, LPC',
    focusAreas: ['Career', 'Work-Life', 'Anxiety'],
    formats: ['Video', 'Call'],
    bookable: false,
    about: 'Supporting work and career transitions.',
  },
  {
    id: 'camille',
    name: 'Camille Reyes',
    credential: 'Licensed Clinical Social Worker',
    focusAreas: ['Relationships', 'Stress', 'Trauma', 'Grief'],
    formats: ['Video', 'Call'],
    bookable: false,
    about: 'Helping clients understand relationships and change.',
  },
  {
    id: 'marcus',
    name: 'Marcus Robinson',
    credential: 'Licensed Clinical Social Worker',
    focusAreas: ['Career', 'Work-Life', 'Anxiety', 'Grief'],
    formats: ['Video', 'In-Person', 'Call'],
    bookable: false,
    about: 'A practical approach to stress and career questions.',
  },
  {
    id: 'isabella',
    name: 'Isabella Flores',
    credential: 'Licensed Clinical Social Worker',
    focusAreas: ['Burnout', 'Depression', 'Work-Life'],
    formats: ['Video', 'In-Person'],
    bookable: false,
    about: 'Support for emotional well-being and balance.',
  },
  {
    id: 'grace',
    name: 'Grace Thompson',
    credential: 'Licensed Mental Health Counselor',
    focusAreas: ['Anxiety', 'Career', 'Relationships', 'Stress'],
    formats: ['Video', 'Call'],
    bookable: false,
    about: 'Exploring life transitions and everyday stress.',
  },
])();

const workDay = () => ({
  enabled: true,
  start: '09:00',
  end: '18:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  slots: 8,
});
const offDay = () => ({
  enabled: false,
  start: '09:00',
  end: '18:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  slots: 0,
});

export const DEFAULT_AVAILABILITY: Availability = (() => ({
  therapistId: 'ava',
  days: {
    Monday: workDay(),
    Tuesday: workDay(),
    Wednesday: workDay(),
    Thursday: workDay(),
    Friday: workDay(),
    Saturday: offDay(),
    Sunday: offDay(),
  },
}))();
