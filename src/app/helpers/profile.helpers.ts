import { Format, Therapist } from '../models/wellspace.model';
import { TherapistProfile } from '../models/therapist-profile.model';

export function directoryWithAva(
  directory: Therapist[],
  ava: TherapistProfile | undefined,
): Therapist[] {
  return directory.map((item) =>
    item.id === 'ava' && ava ? { ...item, ...ava, bookable: true } : item,
  );
}

export function allowedChoice(
  ava: TherapistProfile | undefined,
  format: Format,
  focusArea: string,
): boolean {
  if (!ava) return false;
  return ava.formats.includes(format) && ava.focusAreas.includes(focusArea);
}
