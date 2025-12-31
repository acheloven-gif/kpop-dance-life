import { NPC } from '../types/game';

export type BehaviorModel = 'Burner' | 'Perfectionist' | 'Machine';

/**
 * Determine team leader based on:
 * 1. Most skilled member (highest average of fSkill and mSkill)
 * 2. If tied, pick by behavior priority: Burner > Perfectionist > Machine > others
 */
export const determineTeamLeader = (memberIds: string[], npcs: NPC[]): string | undefined => {
  if (!memberIds || memberIds.length === 0) return undefined;

  const members = memberIds
    .map(id => npcs.find(n => n.id === id))
    .filter((n): n is NPC => n !== undefined);

  if (members.length === 0) return undefined;

  // Calculate average skill for each member
  const memberSkills = members.map(m => ({
    id: m.id,
    avgSkill: (m.fSkill + m.mSkill) / 2,
    behavior: m.behaviorModel as BehaviorModel
  }));

  // Sort by average skill (descending), then by behavior priority
  const behaviorPriority: Record<string, number> = {
    'Burner': 0,
    'Perfectionist': 1,
    'Machine': 2
  };

  memberSkills.sort((a, b) => {
    // First sort by skill (descending)
    if (Math.abs(a.avgSkill - b.avgSkill) > 0.01) {
      return b.avgSkill - a.avgSkill;
    }
    // If skills are equal, sort by behavior priority
    return (behaviorPriority[a.behavior] ?? 99) - (behaviorPriority[b.behavior] ?? 99);
  });

  return memberSkills[0]?.id;
};

/**
 * Recalculate and update leader for a team if needed
 */
export const recalculateTeamLeader = (team: any, npcs: NPC[]): string | undefined => {
  return determineTeamLeader(team.memberIds, npcs);
};
