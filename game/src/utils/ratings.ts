import { NPC } from '../types/game';

export class NPCRatingCalculator {
  // Рейтинг NPC: (0.6 × avgSkill) + (0.3 × popularity) + (0.1 × reputation_normalized)
  // Reputation -1000...+1000 is normalized to 0...1 range
  // Popularity 0...1000 is normalized to 0...1 range
  // Skills 0...1000 remain as is
  static calculateRating(npc: NPC): number {
    const avgSkill = (npc.fSkill + npc.mSkill) / 2 / 1000; // Normalize to 0...1
    const normalizedRep = (npc.reputation + 1000) / 2000; // -1000...+1000 → 0...1
    const normalizedPop = npc.popularity / 1000; // 0...1000 → 0...1
    return (0.6 * avgSkill) + (0.3 * normalizedPop) + (0.1 * normalizedRep);
  }

  static getTop5(npcs: NPC[]): NPC[] {
    return npcs
      .sort((a, b) => this.calculateRating(b) - this.calculateRating(a))
      .slice(0, 5);
  }

  static getPlayerPosition(playerAvgSkill: number, playerPopularity: number, playerReputation: number): number {
    const normalizedAvgSkill = playerAvgSkill / 1000; // Normalize to 0...1
    const normalizedRep = (playerReputation + 1000) / 2000; // -1000...+1000 → 0...1
    const normalizedPop = playerPopularity / 1000; // 0...1000 → 0...1
    const playerRating = (0.6 * normalizedAvgSkill) + (0.3 * normalizedPop) + (0.1 * normalizedRep);
    // Возвращаем приближённое положение по рейтингу (используем рейтинг как показатель позиции для простоты)
    return Math.max(1, Math.round(100 - playerRating));
  }
}
