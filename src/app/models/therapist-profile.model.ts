import { Format, Therapist } from './wellspace.model';

export interface TherapistProfile extends Therapist {
  title: string;
}

export interface ProfileChanges {
  title: string;
  about: string;
  focusAreas: string[];
  formats: Format[];
}
