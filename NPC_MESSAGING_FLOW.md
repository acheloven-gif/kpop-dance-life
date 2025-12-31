# K-pop Game: NPC Messaging Flow Analysis

## Overview
This document outlines how player-initiated NPC contact and messaging is handled in the K-pop game codebase.

---

## 1. PLAYER INITIATES CONTACT

### Entry Points
There are **two main ways** a player initiates contact with an NPC:

#### A. From Messenger Contacts List (`MessengerButton.tsx`)
- **File**: `game/src/components/MessengerButton.tsx` (lines 150)
- **Function**: `proposeCollab(selectedContact.id)`
- **Button**: "Предложить коллаб" (Propose Collab)
- **Code**:
```tsx
<button 
  className="btn-propose-collab" 
  onClick={() => { proposeCollab(selectedContact.id); }}
>
  Предложить коллаб
</button>
```

#### B. From NPC Profile Modal (`NPCProfile.tsx`)
- **File**: `game/src/components/NPCProfile.tsx` (lines 47-48)
- **Buttons**:
  - "Написать" (Write/Message) - line 47
  - "Предложить коллаб" (Propose Collab) - line 48
- **Current Status**: Buttons exist but `onClick` handlers just call `onClose()` - **NOT YET IMPLEMENTED**
- **Code**:
```tsx
<div style={{display:'flex',gap:8}}>
  <button className="btn-action small" onClick={onClose}>Написать</button>
  <button className="btn-action small" onClick={onClose}>Предложить коллаб</button>
  {team && <button className="btn-action small" onClick={onClose}>Открыть команду</button>}
</div>
```

---

## 2. MESSAGE CREATION & QUEUEING FLOW

### `proposeCollab()` Function
**File**: `game/src/context/GameContext.tsx` (lines 284-302)

**What it does:**
1. Finds the NPC by ID
2. Calculates current absolute day (year × 360 + month × 30 + day)
3. Sets a random response delay of 1-7 days
4. Creates a proposal object and queues it in `queuedCollabProposals`

**Code**:
```tsx
const proposeCollab = (npcId: string) => {
  const npc = npcs.find(n => n.id === npcId);
  if (!npc) return;
  const DAYS_PER_MONTH = 30;
  const MONTHS_PER_YEAR = 12;
  const currentAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
  // respondAbsDay: delay 1-7 days from now
  const respondAbsDay = currentAbsDay + 1 + Math.floor(Math.random() * 7);
  const proposal = {
    id: `collab_proposal_${Date.now()}_${Math.random()}`,
    npcId,
    createdAbsDay: currentAbsDay,
    respondAbsDay,
    payload: { npcName: npc.name },
    attempted: false
  };
  setQueuedCollabProposals(prev => [...prev, proposal]);
};
```

---

## 3. MESSAGE PROCESSING & INBOX DELIVERY

### Proposal Response Processing
**File**: `game/src/context/GameContext.tsx` (lines 1720-1750)

**What happens:**
1. On each game day tick, checks `queuedCollabProposals` for proposals ready to respond (`respondAbsDay <= currentAbsDay`)
2. For each ready proposal:
   - Calculates acceptance probability:
     - 80% chance if 1-3 days elapsed
     - 40% chance if 4-7 days elapsed
     - 0% if > 7 days (auto-reject)
   - Creates response message
   - Adds to inbox via `setInbox()`

**Code**:
```tsx
const ready = queuedCollabProposals.filter(q => q.respondAbsDay <= newAbsDay && !q.attempted);
if (ready.length > 0) {
  ready.forEach(proposal => {
    const npc = npcs.find(n => n.id === proposal.npcId);
    if (!npc) return;
    // Calculate days elapsed since proposal sent
    const daysElapsed = newAbsDay - proposal.createdAbsDay;
    // Probability model: 80% chance in days 1-3, 40% in days 4-7, max 7 days total
    let acceptanceChance = 0;
    if (daysElapsed <= 3) acceptanceChance = 0.8;
    else if (daysElapsed <= 7) acceptanceChance = 0.4;
    else acceptanceChance = 0; // max 7 days, then auto-reject
    
    const accepted = Math.random() < acceptanceChance;
    const message = accepted
      ? `${npc.name} согласился на совместный проект!`
      : `${npc.name} отказался от совместного проекта.`;
    
    // Push response to inbox so it appears under the NPC
    setInbox(prev => [{
      id: `collab_res_${proposal.id}`,
      type: 'collab_response',
      npcId: proposal.npcId,
      senderId: proposal.npcId,
      text: message,
      accepted,
      absDay: newAbsDay,
      read: false
    }, ...prev]);
  });
  // Mark proposals as attempted (so we don't re-process them)
  setQueuedCollabProposals(prev => prev.map(q => ready.some(r => r.id === q.id) ? { ...q, attempted: true } : q));
}
```

---

## 4. INCOMING COLLAB OFFERS (From NPCs)

### NPC Initiates Contact with Player
**File**: `game/src/context/GameContext.tsx` (lines 462-500)

**Flow when NPC sends collab offer:**
1. Event is created with `type: 'collab_offer'`
2. Instead of showing as popup, it's routed to inbox
3. Message object created with:
   - `id`: unique collab message ID
   - `type`: 'collab_offer'
   - `npcId`: the NPC sending the offer
   - `npcName`: NPC's name
   - `text`: offer message
   - `absDay`: creation date
   - `expiresAbsDay`: expires after 20 days
   - `collabData`: collab parameters
4. NPC is marked as 'acquaintance' if relationship was 'stranger'
5. NPC met popup is shown

**Code**:
```tsx
if (ev && ev.type === 'collab_offer') {
  try {
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const absDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
    const expiresAbsDay = absDay + 20;
    
    const collabMessage = {
      id: `collab_${ev.npcId}_${Date.now()}`,
      type: 'collab_offer',
      npcId: ev.npcId,
      npcName: ev.npcName,
      text: ev.text,
      read: false,
      createdAbsDay: absDay,
      expiresAbsDay: expiresAbsDay,
      collabData: ev.collabData
    };
    
    setInbox(prev => [collabMessage, ...prev]);
    
    // Mark NPC as 'acquaintance' when collab offer is received
    setNpcs(prev => prev.map(n => n.id === ev.npcId ? { ...n, relationship: n.relationship === 'friend' ? 'friend' : 'acquaintance' } : n));
    
    // Show NPC met popup
    const npc = npcs.find((n: any) => n.id === ev.npcId);
    if (npc && npc.relationship === 'stranger') {
      const team = teams.find((t: any) => t.id === npc.teamId);
      setNpcMetData({
        npc,
        relationship: 'acquaintance' as const,
        teamInfo: team ? { name: team.name, dominantStyle: team.dominantStyle } : undefined
      });
    }
    
    return true;
  } catch (e) {
    // error handling
  }
}
```

---

## 5. INBOX MESSAGE STRUCTURE

### Message Object Format
**File**: `game/src/context/GameContext.tsx` (various locations)

Messages in the inbox follow this pattern:

**Collab Offer (from NPC)**:
```typescript
{
  id: string;              // unique message ID
  type: 'collab_offer';
  npcId: string;           // NPC sending the offer
  npcName: string;         // NPC name
  senderId: string;        // sender ID
  text: string;            // message text
  read: boolean;           // is message read?
  createdAbsDay: number;   // creation date
  expiresAbsDay: number;   // expiration date (20 days)
  collabData: object;      // collab parameters (skill requirements, etc.)
}
```

**Collab Response (to NPC proposal)**:
```typescript
{
  id: string;              // e.g., 'collab_res_...'
  type: 'collab_response';
  npcId: string;           // responding NPC
  senderId: string;        // same as npcId
  text: string;            // acceptance/rejection message
  accepted: boolean;       // did NPC accept?
  absDay: number;          // response date
  read: boolean;           // is message read?
}
```

**Team Application Response**:
```typescript
{
  id: string;              // e.g., 'app_res_...'
  type: 'team_application';
  teamId: string;          // team ID
  npcId: string;           // team leader NPC ID
  senderId: string;        // same as npcId
  text: string;            // acceptance/rejection message
  accepted: boolean;       // was application accepted?
  absDay: number;          // response date
  read: boolean;           // is message read?
}
```

---

## 6. MESSENGER COMPONENT - INBOX DISPLAY

### MessengerButton Component
**File**: `game/src/components/MessengerButton.tsx`

**Key Functions:**

1. **Filtering Contacts** (lines 9-10):
   - Only shows NPCs where player has:
     - relationship != 'stranger', OR
     - trained together >= 3 times, OR
     - did joint projects >= 2 times, OR
     - met at events
   ```tsx
   const contacts = (npcs || []).filter((n: any) => (n.relationship && n.relationship !== 'stranger') || (n.trainingTogetherCount || 0) >= 3 || (n.jointProjectsCount || 0) >= 2 || (n.metEvents || []).length > 0);
   ```

2. **Opening a Contact** (lines 18-20):
   - Finds first unread message from that contact
   - Marks it as read
   ```tsx
   const openForContact = (contact: any) => {
     setSelectedContact(contact);
     const msg = (inbox || []).find((m: any) => !m.read && (m.npcId === contact.id || m.senderId === contact.id));
     if (msg && markMessageRead) markMessageRead(msg.id);
   };
   ```

3. **Displaying Messages** (lines 110-115):
   - Shows all messages from selected contact
   - Shows message date (relative: "сегодня", "1 день назад", etc.)
   - If collab offer, shows Accept/Reject buttons
   - If collab offer expired (>20 days), disables buttons
   - Shows "Propose Collab" button to send new proposal

4. **Message Read Status** (lines 279-280):
   ```tsx
   const markMessageRead = (messageId: string) => {
     setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
   };
   ```

---

## 7. PLAYER RESPONSE HANDLING

### Accept Collab Offer
**File**: `game/src/context/GameContext.tsx` (lines 1500-1570)

**Function**: `processCollabAccept(params: { npcId, requiredSkillType, requiredSkill, npcName })`

**What happens:**
1. Checks if player has required skill level
2. If successful: +popularity, +reputation, show "success" event popup
3. If failed: -reputation, show "failed" event popup

### Reject Collab Offer
**File**: `game/src/context/GameContext.tsx` (lines 1580-1607)

**Function**: `processCollabReject(collabMessageId, npcId, npcName)`

**What happens:**
1. Checks if offer is expired
2. If expired: just mark as read, no penalty
3. If active: apply -3 reputation penalty, show "rejection" event popup
4. Mark message as read

---

## 8. KEY GAME CONTEXT EXPORTS

**File**: `game/src/context/GameContext.tsx` (lines 2299-2315)

**Exposed Functions & State**:
```typescript
{
  inbox: Message[];                          // all messages
  markMessageRead: (messageId: string) => void;
  processCollabAccept: (params) => void;
  processCollabReject: (messageId, npcId, npcName) => void;
  proposeCollab: (npcId: string) => void;    // PLAYER SENDS PROPOSAL
  
  // Related state
  queuedCollabProposals: QueuedProposal[];
  queuedApplications: QueuedApplication[];
  
  // NPC & team data
  npcs: NPC[];
  teams: Team[];
}
```

---

## 9. CURRENT IMPLEMENTATION GAP

### What's NOT Yet Implemented

The "Написать" (Write Message) button in `NPCProfile.tsx` (line 47) currently just closes the dialog:

```tsx
<button className="btn-action small" onClick={onClose}>Написать</button>
```

**Future enhancement needed:**
- This button should allow player to compose and send a custom message to the NPC
- Message would be added to inbox
- NPC would receive it in their message queue
- Response logic would need to be implemented

---

## 10. RELATIONSHIP FLOW DIAGRAM

```
PLAYER INITIATES CONTACT
    ↓
proposeCollab(npcId) → queuedCollabProposals
    ↓
[1-7 days pass]
    ↓
NPC_RESPONDS (80% days 1-3, 40% days 4-7)
    ↓
Message added to inbox
    ↓
Player sees in Messenger
    ↓
Player Accept/Reject/Read
    ↓
NPC RELATIONSHIP UPDATED
```

---

## 11. SUMMARY

**To add NPC to Messenger contacts when player initiates contact:**

1. **Current state**: Contact appears if player has non-stranger relationship
2. **When contact initiates**: NPC marked as 'acquaintance' when:
   - NPC sends collab offer, OR
   - Message from NPC appears in inbox
3. **Key function to hook into**: `proposeCollab()` - this is where player actively initiates
4. **After calling `proposeCollab()`**: 
   - NPC should be updated to 'acquaintance' relationship
   - NPC should appear in Messenger contacts list
   - Queue is set up for response

**Implementation location**:
- Modify `proposeCollab()` in `GameContext.tsx` (line 284-302)
- OR create new function that wraps `proposeCollab()` and adds relationship update
- Call `setNpcs()` to update the NPC's relationship to 'acquaintance'
