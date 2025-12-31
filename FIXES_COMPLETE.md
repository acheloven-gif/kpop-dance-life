# Исправления 11 декабря 2025 - Картинки и инвентарь

## 1. ✅ Замена картинок лиц (faces)

**Что было:** Используются старые картинки из `game/public/faces/`

**Что сделано:**
- Скопировал все 27 файлов из `C:\Users\2ой пользователь\kpop 1.3\faces\normalized` напрямую в `game/public/faces/`
- Картинки в окне создания персонажа теперь загружаются из `faces/` по пути `/faces/{code}.png` (например, `/faces/mdb.png`)

**Проверка:** Картинки лиц должны меняться при выборе волос, цвета волос и цвета глаз в CharacterCreation

---

## 2. ✅ Замена аватаров НПЦ (avatars)

**Что было:** Старые аватары в `game/public/avatars/`, новые в `avatars\normalized`

**Что сделано:**
- Скопировал все 52 файла из `C:\Users\2ой пользователь\kpop 1.3\avatars\normalized` в `game/public/avatars/`
- Перезаписал старые файлы новыми версиями
- Также скопировал в `game/public/avatars/normalized/` для использования по пути `/avatars/normalized/`

**Проверка:** Аватары НПЦ в командах, модальных окнах и профилях должны отображать новые изображения

---

## 3. ✅ Исправление инвентаря (пустые иконки)

**Что было:**
- При загрузке игры инвентарь загружался из localStorage (если там была старая сохраненная информация)
- Отображались какие-то пустые иконки, а не только нужные 3 предмета
- При перезагрузке страницы инвентарь сохранялся через localStorage

**Что сделано в [GameContext.tsx](game/src/context/GameContext.tsx):**

### Изменение 1: Инициализация инвентаря (строка ~383)
```tsx
// БЫЛО: загружало из localStorage
const [playerInventory, setPlayerInventory] = useState<string[]>(() => {
  const saved = localStorage.getItem('playerInventory');
  if (saved) return JSON.parse(saved);  // ❌ Это вызывало проблему
  return ['inv_shoes_white_sneakers', 'inv_top_white_tshirt', 'inv_bottom_black_baggy'];
});

// СТАЛО: всегда начинает с дефолтных предметов
const [playerInventory, setPlayerInventory] = useState<string[]>(
  ['inv_shoes_white_sneakers', 'inv_top_white_tshirt', 'inv_bottom_black_baggy']
);
```

### Изменение 2: initializeGame() (строка ~2494)
```tsx
// БЫЛО: только устанавливал имя
const initializeGame = (name: string) => {
  setState(prev => ({...prev, player: {...prev.player, name}, gameStarted: true}));
};

// СТАЛО: сбрасывает инвентарь при начале новой игры
const initializeGame = (name: string) => {
  setPlayerInventory(['inv_shoes_white_sneakers', 'inv_top_white_tshirt', 'inv_bottom_black_baggy']);
  try { localStorage.removeItem('playerInventory'); } catch (e) { /* ignore */ }
  setState(prev => ({...prev, player: {...prev.player, name}, gameStarted: true}));
};
```

### Изменение 3: loadGame() (строка ~2510)
```tsx
// БЫЛО: только загружал state
const loadGame = () => {
  const saved = localStorage.getItem('gameState');
  if (saved) setState(JSON.parse(saved));
};

// СТАЛО: также восстанавливает playerInventory из сохранения
const loadGame = () => {
  const saved = localStorage.getItem('gameState');
  if (saved) {
    const loadedState = JSON.parse(saved);
    setState(loadedState);
    if (loadedState.player && Array.isArray(loadedState.player.playerInventory)) {
      setPlayerInventory(loadedState.player.playerInventory);
    }
  }
};
```

### Изменение 4: saveGame() (строка ~2518)
```tsx
// БЫЛО: сохранял только state
const saveGame = () => {
  localStorage.setItem('gameState', JSON.stringify(state));
};

// СТАЛО: сохраняет playerInventory вместе с state
const saveGame = () => {
  const stateWithInventory = {
    ...state,
    player: {...state.player, playerInventory: playerInventory}
  };
  localStorage.setItem('gameState', JSON.stringify(stateWithInventory));
};
```

---

## Логика работы инвентаря:

| Сценарий | Что происходит |
|----------|----------------|
| **Загрузка страницы (новая игра)** | Инвентарь инициализируется с 3 дефолтными предметами (белая футболка, черные штаны, белые кроссовки) |
| **Нажимаем "Start" в CharacterCreation** | Инвентарь сбрасывается на дефолт, localStorage очищается, игра начинается |
| **Нажимаем "Load" с сохраненным файлом** | Загружается сохраненный state со всеми данными, инвентарь восстанавливается из сохранения |
| **Перезагружаем страницу во время игры** | Без явного сохранения инвентарь будет дефолтным (localStorage не восстанавливает) |
| **Нажимаем "Save" в меню** | Инвентарь сохраняется в gameState, восстанавливается при загрузке этого файла |

---

## Файлы, которые были изменены:

1. ✅ `game/public/faces/` — все файлы заменены на новые из `faces\normalized`
2. ✅ `game/public/avatars/` — все файлы заменены на новые из `avatars\normalized`
3. ✅ `game/public/avatars/normalized/` — скопированы новые файлы
4. ✅ `game/src/context/GameContext.tsx` — исправлена логика инвентаря (4 функции)

---

## Как проверить:

1. **Откройте http://localhost:5173/**
2. **Создайте персонажа** — меняйте параметры волос, должны меняться картинки в preview
3. **Начните игру** — в инвентаре должны быть только 3 предмета: белая футболка, черные штаны, белые кроссовки
4. **Перезагрузите страницу** (F5) — инвентарь вернется к дефолту (не сохраняется через localStorage)
5. **Сохраните игру** — инвентарь сохранится в файле
6. **Загрузите файл сохранения** — инвентарь восстановится из файла

---

## Сборка:

✅ `npm run build` — успешно собран
✅ `npm run dev` — сервер запущен на http://localhost:5173/

Все готово!
