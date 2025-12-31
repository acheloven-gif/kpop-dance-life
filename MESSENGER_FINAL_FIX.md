# Финальное исправление системы сообщений в мессенджере

## Обнаруженные проблемы

1. **Асинхронность setState**: Обработка предложений/заявок вызывалась ПОСЛЕ setState, но `stateRef.current` еще не обновлялся
2. **Неправильный расчет absDay**: Вычислялся день на завтра вместо сегодня
3. **Отсутствие проверки attempted**: Заявки обрабатывались несколько раз
4. **NPC не в контактах**: При отправке предложения NPC не добавлялся в relationship 'acquaintance'

## Решения

### 1. GameContext.tsx - Исправлена последовательность обработки (строка 1462+)

**БЫЛО:**
```javascript
setState(prev => {
  // ... вычисляем newDay, newMonth, newYear
  return { ...prev, gameTime: { ... } };
});

// После setState - но stateRef еще не обновлен!
const newAbsDay = stateRef.current.gameTime...  // НЕПРАВИЛЬНО
```

**СТАЛО:**
```javascript
// Вычисляем absDay ДО setState, используя уже рассчитанные значения
let newDay = state.gameTime.day + 1;
let newMonth = state.gameTime.month;
let newYear = state.gameTime.year;
// ... логика переноса дней

const newAbsDay = newYear * (...) + newMonth * (...) + newDay;
newAbsDayRef.current = newAbsDay;  // Сохраняем СРАЗУ

setState(prev => {
  // Вычисляем то же самое для setState
  // ...
});
```

### 2. GameContext.tsx - Проверка attempted при фильтрации (строка 2521, 2566)

**БЫЛО:**
```javascript
const ready = queuedApplicationsRef.current.filter(q => q.reviewAbsDay <= newAbsDay);
// Заявки обрабатываются каждый день!
```

**СТАЛО:**
```javascript
const ready = queuedApplicationsRef.current.filter(q => q.reviewAbsDay <= newAbsDay && !q.attempted);
// Только необработанные заявки
```

### 3. GameContext.tsx - Обновление статуса attempted (строка 2548-2554, 2608-2610)

**БЫЛО:**
```javascript
const filtered = queuedApplicationsRef.current.filter(q => q.reviewAbsDay > newAbsDay);
setQueuedApplications(filtered);  // Удаляем обработанные
```

**СТАЛО:**
```javascript
const updated = queuedApplicationsRef.current.map(q => 
  ready.some(r => r.id === q.id) ? { ...q, attempted: true } : q
);
setQueuedApplications(updated);  // Помечаем как обработанные
```

### 4. GameContext.tsx - Добавление NPC в отношения при предложении (строка 446)

**БЫЛО:**
```javascript
setQueuedCollabProposals(prev => [...prev, proposal]);
// NPC не добавляется в контакты!
```

**СТАЛО:**
```javascript
setQueuedCollabProposals(prev => [...prev, proposal]);
setNpcs(prev => prev.map(n => n.id === npcId ? { ...n, relationship: n.relationship === 'friend' ? 'friend' : 'acquaintance' } : n));
// Теперь NPC появляется в контактах
```

### 5. MessengerButton.tsx - Отображение ответов на заявки (строка 554+)

Добавлена обработка `team_application_response`:
```jsx
{m.type === 'team_application_response' && m.accepted && (
  <div>✓ Заявка принята!</div>
)}
```

## Логирование для отладки

Добавлены console.log сообщения:
```
[Team App Processing] newAbsDay=X, queuedCount=Y
[Team App Processing] ready=Z
[Collab Proposal Processing] newAbsDay=X, queuedCount=Y
[Collab Proposal Processing] Adding N messages to inbox
```

## Процесс работы (правильная последовательность)

1. **Отправка**: `proposeCollab()` → добавляет в `queuedCollabProposals` + обновляет relationship NPC
2. **Каждый день**: таймер вычисляет `newAbsDay`, сохраняет в ref
3. **Обработка**: фильтрует готовые (где `respondAbsDay <= newAbsDay && !attempted`)
4. **Добавление**: добавляет ответ-сообщение в `inbox`
5. **Отметка**: обновляет `attempted: true` чтобы не обрабатывать дважды
6. **Отображение**: MessengerButton показывает NPC в контактах (есть сообщение) и отображает ответ

## Тестирование

1. Отправьте предложение коллаба → NPC должен появиться в контактах
2. Пройдите 1-7 дней (зависит от случайного значения `respondAbsDay`)
3. Проверьте console.log для отладки:
   - `[Collab Proposal Processing] newAbsDay=X` - день обновляется
   - `[Collab Proposal Processing] ready=1` - найдено 1 готовое предложение
   - `[Collab Proposal Processing] Adding 1 messages` - сообщение добавлено в inbox
4. Откройте мессенджер и проверьте наличие ответа от NPC

То же для заявок в команду (Team App Processing logs).
