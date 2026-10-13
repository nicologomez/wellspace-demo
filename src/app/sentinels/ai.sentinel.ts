import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AiSentinel {
  async discussionPoints(reflection: string): Promise<string> {
    const thoughts = reflection.trim();
    if (thoughts.length < 10) throw Error('Write a few thoughts first.');
    // Simulates AI response locally:
    return `1. Explore recent stressors regarding: "${thoughts.slice(0, 30)}..."\n2. Discuss emotional balance and boundaries.\n3. Identify practical coping strategies for the upcoming week.`;
  }
}
