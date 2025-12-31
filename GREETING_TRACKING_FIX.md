# Fix: Greeting Button State Tracking Issue

## Problem
The "Поздравить с НГ" (New Year greeting) button appeared when it shouldn't because the game didn't track which NPCs had already received greetings from the player.

Similarly, the birthday greeting button ("Поздравить с ДР") would have the same issue.

## Root Cause Analysis
1. **NPCProfile.tsx**: Button visibility logic was checking `state?.player?.newYearGreetingsSent` correctly
2. **GameContext.tsx**: The `sendNewYearGreeting()` and `sendBirthdayGreeting()` functions were **NOT updating** `player.newYearGreetingsSent` and `player.birthdayGreetingsSent` respectively
3. **types.ts**: The `PlayerCharacter` interface was missing these tracking fields
4. **GameContext.tsx**: The `INITIAL_GAME_STATE` was not initializing these fields

## Changes Made

### 1. **game/src/types.ts** - Added tracking fields to PlayerCharacter interface
```typescript
newYearGreetingsSent?: Record<string, boolean>; // Track which NPCs received New Year greetings
birthdayGreetingsSent?: Record<string, boolean>; // Track which NPCs received birthday greetings
```

### 2. **game/src/context/GameContext.tsx** - Multiple fixes

#### a. Initialize tracking objects in INITIAL_GAME_STATE (lines ~48-49)
```typescript
newYearGreetingsSent: {},
birthdayGreetingsSent: {},
```

#### b. Update sendNewYearGreeting() to track greeting (lines ~423-432)
Added after setting inbox and NPC records:
```typescript
// Mark greeting as sent in player state
setState(prev => ({
  ...prev,
  player: {
    ...prev.player,
    newYearGreetingsSent: {
      ...(prev.player.newYearGreetingsSent || {}),
      [npcId]: true
    }
  }
}));
```

#### c. Update sendBirthdayGreeting() to track greeting (lines ~2864-2873)
Added the same state update pattern for birthday greetings.

### 3. **game/src/components/NPCProfile.tsx** - Added birthday greeting UI

#### a. Import `sendBirthdayGreeting` from GameContext (line 22)
```typescript
const { ..., sendBirthdayGreeting } = useGame() as any;
```

#### b. Add tracking for birthday greetings (lines ~46-48)
```typescript
const birthdayGreetingsSent = state?.player?.birthdayGreetingsSent || {};
const hasBirthdayGreetingBeenSent = birthdayGreetingsSent[npc.id] ? true : false;
```

#### c. Add birthday greeting buttons (lines ~203-230)
- Button appears only when `isBirthdayToday && !hasBirthdayGreetingBeenSent`
- Disabled button shows after greeting is sent
- Styled similarly to New Year greeting button

## How It Works Now

### New Year Greeting Flow:
1. Check: Is date Dec 1 - Jan 1? → Show button
2. Check: Is `player.newYearGreetingsSent[npcId]` true? → Hide/disable button
3. Player clicks "Поздравить с НГ"
4. `sendNewYearGreeting()` is called
5. Function now **updates** `player.newYearGreetingsSent[npcId] = true`
6. Button disappears for this NPC for the rest of the season
7. **State is saved to localStorage** → persists across sessions

### Birthday Greeting Flow:
1. Check: Is today the NPC's birthday? → Show button
2. Check: Is `player.birthdayGreetingsSent[npcId]` true? → Hide/disable button
3. Player clicks "Поздравить с ДР"
4. `sendBirthdayGreeting()` is called
5. Function now **updates** `player.birthdayGreetingsSent[npcId] = true`
6. Button disappears for this NPC after greeting is sent
7. **State is saved to localStorage** → persists across sessions

## Date Logic Verification
✅ New Year Season Detection (NPCProfile.tsx lines 38-40):
- `isNewYearSeason = (currentMonth === 11) || (currentMonth === 0 && currentDay === 1)`
- Correctly checks December (month 11) any day OR January 1st (month 0, day 1)

✅ Birthday Detection:
- `isBirthdayToday = daysUntilBirthday === 0`
- Shows button only on the exact date

## Files Modified
1. `game/src/types.ts` - Added interface fields
2. `game/src/context/GameContext.tsx` - Initialize + update greeting tracking
3. `game/src/components/NPCProfile.tsx` - Add birthday greeting UI

## Testing Checklist
- [x] No TypeScript errors
- [ ] Start new game on Dec 1 → button should appear
- [ ] Send greeting → button disappears
- [ ] Load saved game → button remains hidden
- [ ] Start new game on birthday → button should appear
- [ ] Send greeting → button disappears
- [ ] Load saved game → button remains hidden
- [ ] Check outside Dec 1 - Jan 1 range → New Year button shouldn't appear
- [ ] Check on non-birthday dates → Birthday button shouldn't appear
