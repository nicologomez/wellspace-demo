import { TherapistProfile } from '../models/therapist-profile.model';
import { THERAPISTS } from './demo-data';

export const DEFAULT_AVA_PROFILE: TherapistProfile = (() => ({
  ...THERAPISTS[0],
  id: 'ava',
  name: 'Ava Smith',
  credential: 'Licensed Psychologist, PhD',
  title: 'Helping adults move through change with more clarity.',
  about:
    'I help adults understand patterns that keep them feeling stuck, ' +
    'overwhelmed, or disconnected. We’ll build practical tools for managing ' +
    'anxiety, navigating change, and making decisions with more clarity. ' +
    'My style is warm, structured, and grounded in evidence-based care.',
  focusAreas: ['Burnout', 'Stress', 'Relationships', 'Work-Life'],
  formats: ['Video', 'Call', 'In-Person'],
  bookable: true,
}))();
