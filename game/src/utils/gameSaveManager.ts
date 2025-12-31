import telegramWebApp from './telegramUtils';

/**
 * Сервис для сохранения и загрузки игровых данных
 * Использует Telegram CloudStorage с fallback на localStorage
 */

export interface SaveData {
  gameState: any;
  activeProjects: any[];
  completedProjects: any[];
  playerInventory: any[];
  timestamp: number;
  version: string;
}

const SAVE_KEYS = {
  gameState: 'kcd_gameState',
  activeProjects: 'kcd_activeProjects',
  completedProjects: 'kcd_completedProjects',
  playerInventory: 'kcd_playerInventory',
  metadata: 'kcd_metadata',
} as const;

const APP_VERSION = '1.4.0';

class GameSaveManager {
  /**
   * Сохранить все игровые данные
   */
  async saveAllData(
    gameState: any,
    activeProjects: any[],
    completedProjects: any[],
    playerInventory: any[]
  ): Promise<void> {
    try {
      const metadata = {
        timestamp: Date.now(),
        version: APP_VERSION,
        userId: telegramWebApp.getUserId(),
        userName: telegramWebApp.getUserName(),
      };

      // Сохранить каждый элемент отдельно для лучшей надежности
      await Promise.all([
        telegramWebApp.saveData(SAVE_KEYS.gameState, gameState),
        telegramWebApp.saveData(SAVE_KEYS.activeProjects, activeProjects),
        telegramWebApp.saveData(SAVE_KEYS.completedProjects, completedProjects),
        telegramWebApp.saveData(SAVE_KEYS.playerInventory, playerInventory),
        telegramWebApp.saveData(SAVE_KEYS.metadata, metadata),
      ]);

      console.log('[SaveManager] Game saved successfully', metadata);
    } catch (error) {
      console.error('[SaveManager] Error saving game:', error);
      throw error;
    }
  }

  /**
   * Загрузить все игровые данные
   */
  async loadAllData(): Promise<Partial<SaveData> | null> {
    try {
      const [gameState, activeProjects, completedProjects, playerInventory, metadata] = await Promise.all([
        telegramWebApp.loadData(SAVE_KEYS.gameState),
        telegramWebApp.loadData(SAVE_KEYS.activeProjects),
        telegramWebApp.loadData(SAVE_KEYS.completedProjects),
        telegramWebApp.loadData(SAVE_KEYS.playerInventory),
        telegramWebApp.loadData(SAVE_KEYS.metadata),
      ]);

      if (!gameState) {
        return null; // Нет сохраненной игры
      }

      console.log('[SaveManager] Game loaded successfully', metadata);

      return {
        gameState,
        activeProjects: activeProjects || [],
        completedProjects: completedProjects || [],
        playerInventory: playerInventory || [],
        timestamp: metadata?.timestamp || Date.now(),
        version: metadata?.version || APP_VERSION,
      };
    } catch (error) {
      console.error('[SaveManager] Error loading game:', error);
      return null;
    }
  }

  /**
   * Сохранить отдельный элемент
   */
  async saveItem(key: keyof typeof SAVE_KEYS, data: any): Promise<void> {
    try {
      await telegramWebApp.saveData(SAVE_KEYS[key], data);
    } catch (error) {
      console.error(`[SaveManager] Error saving ${key}:`, error);
      throw error;
    }
  }

  /**
   * Загрузить отдельный элемент
   */
  async loadItem(key: keyof typeof SAVE_KEYS): Promise<any> {
    try {
      return await telegramWebApp.loadData(SAVE_KEYS[key]);
    } catch (error) {
      console.error(`[SaveManager] Error loading ${key}:`, error);
      return null;
    }
  }

  /**
   * Очистить все сохранения
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        telegramWebApp.deleteData(SAVE_KEYS.gameState),
        telegramWebApp.deleteData(SAVE_KEYS.activeProjects),
        telegramWebApp.deleteData(SAVE_KEYS.completedProjects),
        telegramWebApp.deleteData(SAVE_KEYS.playerInventory),
        telegramWebApp.deleteData(SAVE_KEYS.metadata),
      ]);

      console.log('[SaveManager] All data cleared');
    } catch (error) {
      console.error('[SaveManager] Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Получить информацию о последнем сохранении
   */
  async getSaveMetadata() {
    try {
      return await telegramWebApp.loadData(SAVE_KEYS.metadata);
    } catch (error) {
      console.error('[SaveManager] Error loading metadata:', error);
      return null;
    }
  }

  /**
   * Проверить есть ли сохраненная игра
   */
  async hasSavedGame(): Promise<boolean> {
    try {
      const gameState = await telegramWebApp.loadData(SAVE_KEYS.gameState);
      return !!gameState;
    } catch (error) {
      console.error('[SaveManager] Error checking saved game:', error);
      return false;
    }
  }
}

// Singleton
let instance: GameSaveManager;

export function getGameSaveManager(): GameSaveManager {
  if (!instance) {
    instance = new GameSaveManager();
  }
  return instance;
}

export default getGameSaveManager();
