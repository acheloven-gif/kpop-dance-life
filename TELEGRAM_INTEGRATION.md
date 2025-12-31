# Интеграция Telegram Web App в K-Cover Dance Life

## Обзор

Игра теперь полностью интегрирована с Telegram Web App API, что позволяет:

- ✅ Запускать игру прямо в Telegram боте
- ✅ Сохранять данные в Telegram CloudStorage
- ✅ Получать информацию о пользователе Telegram
- ✅ Отправлять данные обратно в бот
- ✅ Полная поддержка темы Telegram (светлая/темная)
- ✅ Оптимизация для мобильных устройств

## Основные компоненты

### 1. Утилиты (`src/utils/telegramUtils.ts`)

Основной класс `TelegramWebApp` для работы с Telegram API:

```typescript
import telegramWebApp from './utils/telegramUtils';

// Получить информацию о пользователе
const user = telegramWebApp.getUser();
const userId = telegramWebApp.getUserId();
const userName = telegramWebApp.getUserName();

// Сохранить данные
await telegramWebApp.saveData('gameState', gameData);

// Загрузить данные
const data = await telegramWebApp.loadData('gameState');

// Показать уведомление
telegramWebApp.showAlert('Game saved!');

// Закрыть веб-приложение
telegramWebApp.close();
```

### 2. Хуки (`src/hooks/useTelegram.ts`)

React хуки для удобного использования:

```typescript
import { useTelegram, useTelegramStorage } from './hooks/useTelegram';

// Базовый хук
const { isReady, user, isDarkMode, colorScheme } = useTelegram();

// Хук для работы со хранилищем
const { data, loading, saveData } = useTelegramStorage('myKey');

// Использование
function MyComponent() {
  const { isDarkMode } = useTelegram();
  
  return <div className={isDarkMode ? 'dark' : 'light'}>Content</div>;
}
```

### 3. Менеджер сохранений (`src/utils/gameSaveManager.ts`)

Автоматическое управление сохранениями игры:

```typescript
import gameSaveManager from './utils/gameSaveManager';

// Сохранить все данные
await gameSaveManager.saveAllData(
  gameState,
  activeProjects,
  completedProjects,
  playerInventory
);

// Загрузить все данные
const saveData = await gameSaveManager.loadAllData();

// Проверить наличие сохраненной игры
const hasSave = await gameSaveManager.hasSavedGame();

// Очистить все сохранения
await gameSaveManager.clearAllData();
```

### 4. Компонент информации (`src/components/TelegramUserInfo.tsx`)

Отображение информации о пользователе Telegram:

```typescript
import TelegramUserInfo from './components/TelegramUserInfo';

export function MyComponent() {
  return (
    <div>
      <TelegramUserInfo />
    </div>
  );
}
```

## Мобильная оптимизация

### CSS переменные Telegram

Все цвета приложения используют переменные Telegram:

```css
:root {
  --tg-theme-bg-color: #ffffff;
  --tg-theme-text-color: #000000;
  --tg-theme-button-color: #0088cc;
  --tg-theme-button-text-color: #ffffff;
}
```

### Safe Area для устройств с notch

```css
padding-top: var(--safe-area-inset-top);
padding-bottom: var(--safe-area-inset-bottom);
```

### Оптимизация для мобильных

- Минимальная высота кнопок: 44px (iOS стандарт)
- Smooth scrolling с `-webkit-overflow-scrolling: touch`
- Viewport height: `100dvh` (dynamic viewport height)
- Fixed меню и интерфейс

## Сохранение данных

### Приоритет хранилища

1. **Telegram CloudStorage** (если доступен)
   - Синхронизируется с облаком Telegram
   - Данные доступны на всех устройствах пользователя
   - Требует доступа в боте (requestWriteAccess)

2. **Fallback на localStorage**
   - Локальное хранилище браузера
   - Работает в тестировании и без интернета
   - Данные только на текущем устройстве

### Автоматическое сохранение

Игра автоматически сохраняет:
- Состояние игры (gameState)
- Активные проекты (activeProjects)
- Завершенные проекты (completedProjects)
- Инвентарь игрока (playerInventory)
- Метаданные (timestamp, версия)

## Отправка данных в бот

Отправить данные из игры в бот:

```typescript
import telegramWebApp from './utils/telegramUtils';

// Отправить пользовательские данные боту
telegramWebApp.sendData({
  type: 'game_completed',
  score: 1000,
  timestamp: Date.now()
});
```

В боте (`bot/src/index.ts`):

```typescript
bot.on('web_app_data', async (ctx) => {
  const gameData = JSON.parse(ctx.webAppData.data);
  // Обработать данные
});
```

## Примеры использования

### Пример 1: Сохранение при выходе

```typescript
import { useGame } from './context/GameContext';
import gameSaveManager from './utils/gameSaveManager';

function GameComponent() {
  const { state, /* ... */ } = useGame();

  useEffect(() => {
    const handleBeforeUnload = async () => {
      await gameSaveManager.saveAllData(
        state,
        activeProjects,
        completedProjects,
        state.player.inventory
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);
}
```

### Пример 2: Отключение при темной теме

```typescript
import { useTelegram } from './hooks/useTelegram';

function MyComponent() {
  const { isDarkMode } = useTelegram();

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      Контент меняется в зависимости от темы
    </div>
  );
}
```

### Пример 3: Уведомления пользователю

```typescript
import telegramWebApp from './utils/telegramUtils';

// Информационное уведомление
telegramWebApp.showAlert('Игра сохранена!');

// Подтверждение действия
telegramWebApp.showConfirm(
  'Вы уверены?',
  (confirmed) => {
    if (confirmed) {
      // Действие
    }
  }
);
```

## Тестирование

### Локально (без Telegram)

Все функции имеют fallback для работы без Telegram Web App:
- `localStorage` используется вместо CloudStorage
- `alert/confirm` используются вместо Telegram методов
- Приложение полностью функционально

### С Telegram (test bot)

1. Создайте тест бота через @BotFather
2. Запустите локальный сервер
3. Используйте ngrok или tunneling для HTTPS
4. Откройте веб-приложение в Telegram

## Производство

### Подготовка к production

1. Обновите `WEB_APP_URL` в боте на production домен
2. Убедитесь, что используется HTTPS
3. Установите вебхук для бота
4. Протестируйте на реальном устройстве

### Переменные окружения

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnopqrstuvwxyz
WEB_APP_URL=https://yourdomain.com/game
NODE_ENV=production
PORT=3000
```

## Полезные ссылки

- [Telegram Web Apps API](https://core.telegram.org/bots/webapps)
- [Telegram CloudStorage](https://core.telegram.org/bots/webapps#cloudstorage)
- [Bot API Reference](https://core.telegram.org/bots/api)
- [Telegraf.js](https://telegraf.js.org/)

## Поддерживаемые браузеры

- ✅ Telegram App (iOS)
- ✅ Telegram App (Android)
- ✅ Telegram Web
- ✅ Telegram Desktop (при наличии Web App support)
- ✅ Chrome, Firefox, Safari на мобильных

## Перспективы развития

- Лидерборды в боте
- Достижения и бейджи
- Социальные функции (PvP, торговля)
- Интеграция с рейтингами бота
- Уведомления о событиях в боте
