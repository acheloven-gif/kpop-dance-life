/**
 * Telegram Web App утилиты
 * Для работы с Telegram Bot API и CloudStorage
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        onEvent: (event: string, callback: () => void) => void;
        offEvent: (event: string, callback: () => void) => void;
        showPopup: (options: PopupOptions) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (result: boolean) => void) => void;
        requestWriteAccess: (callback?: (result: boolean) => void) => void;
        requestContactAccess: (callback?: (result: boolean) => void) => void;
        readTextFromClipboard: (callback?: (result: string | null) => void) => void;
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: ThemeParams;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        bottomBarColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: any) => void) => void;
          getItem: (key: string, callback?: (error: any, value: string | null) => void) => void;
          getItems: (keys: string[], callback?: (error: any, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: any) => void) => void;
          removeItems: (keys: string[], callback?: (error: any) => void) => void;
          getKeys: (callback?: (error: any, keys: string[]) => void) => void;
        };
        isVersionAtLeast: (version: string) => boolean;
      };
    };
  }
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  destructive_text_color?: string;
}

interface PopupOptions {
  title?: string;
  message: string;
  buttons?: Array<{
    id?: string;
    type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
    text?: string;
  }>;
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private initialized = false;
  private user: TelegramUser | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  private init(): void {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();
      
      this.user = webApp.initDataUnsafe?.user || null;
      this.initialized = true;

      // Установить тему в соответствии с Telegram
      this.applyTheme();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getUser(): TelegramUser | null {
    return this.user;
  }

  getUserId(): number | null {
    return this.user?.id || null;
  }

  getUserName(): string {
    if (this.user?.first_name) {
      return this.user.first_name + (this.user.last_name ? ` ${this.user.last_name}` : '');
    }
    return 'Player';
  }

  getInitData(): string {
    return window.Telegram?.WebApp?.initData || '';
  }

  /**
   * Сохранить данные в Telegram CloudStorage
   */
  async saveData(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.Telegram?.WebApp?.CloudStorage) {
        console.warn('Telegram CloudStorage не доступна, используем localStorage');
        localStorage.setItem(key, JSON.stringify(data));
        resolve();
        return;
      }

      const webApp = window.Telegram.WebApp;
      const jsonString = JSON.stringify(data);
      
      webApp.CloudStorage.setItem(key, jsonString, (error: any) => {
        if (error) {
          console.error('Ошибка сохранения:', error);
          localStorage.setItem(key, jsonString);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Загрузить данные из Telegram CloudStorage
   */
  async loadData(key: string): Promise<any> {
    return new Promise((resolve) => {
      if (!window.Telegram?.WebApp?.CloudStorage) {
        console.warn('Telegram CloudStorage не доступна, используем localStorage');
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : null);
        return;
      }

      const webApp = window.Telegram.WebApp;
      webApp.CloudStorage.getItem(key, (error: any, value: string | null) => {
        if (error) {
          console.error('Ошибка загрузки:', error);
          const localData = localStorage.getItem(key);
          resolve(localData ? JSON.parse(localData) : null);
        } else {
          resolve(value ? JSON.parse(value) : null);
        }
      });
    });
  }

  /**
   * Удалить данные из CloudStorage
   */
  async deleteData(key: string): Promise<void> {
    return new Promise((resolve) => {
      if (!window.Telegram?.WebApp?.CloudStorage) {
        localStorage.removeItem(key);
        resolve();
        return;
      }

      const webApp = window.Telegram.WebApp;
      webApp.CloudStorage.removeItem(key, () => {
        localStorage.removeItem(key);
        resolve();
      });
    });
  }

  /**
   * Применить тему Telegram к приложению
   */
  private applyTheme(): void {
    if (!window.Telegram?.WebApp) return;

    const webApp = window.Telegram.WebApp;
    const isDarkMode = webApp.colorScheme === 'dark';
    const root = document.documentElement;

    // Установить CSS переменные на основе темы Telegram
    root.style.setProperty('--tg-theme-bg-color', webApp.themeParams.bg_color || '#ffffff');
    root.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color || '#000000');
    root.style.setProperty('--tg-theme-hint-color', webApp.themeParams.hint_color || '#999999');
    root.style.setProperty('--tg-theme-link-color', webApp.themeParams.link_color || '#0088cc');
    root.style.setProperty('--tg-theme-button-color', webApp.themeParams.button_color || '#0088cc');
    root.style.setProperty('--tg-theme-button-text-color', webApp.themeParams.button_text_color || '#ffffff');

    // Применить класс для темы
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
  }

  /**
   * Показать уведомление
   */
  showAlert(message: string, callback?: () => void): void {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  }

  /**
   * Показать подтверждение
   */
  showConfirm(message: string, callback?: (result: boolean) => void): void {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      callback?.(result);
    }
  }

  /**
   * Отправить данные боту
   */
  sendData(data: any): void {
    const jsonString = JSON.stringify(data);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(jsonString);
    } else {
      console.log('Данные для отправки:', jsonString);
    }
  }

  /**
   * Закрыть Web App
   */
  close(): void {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  }

  /**
   * Включить/выключить вертикальное расширение
   */
  expand(): void {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }

  /**
   * Проверить версию Telegram
   */
  isVersionAtLeast(version: string): boolean {
    return window.Telegram?.WebApp?.isVersionAtLeast(version) || false;
  }

  /**
   * Получить высоту вьюпорта
   */
  getViewportHeight(): number {
    return window.Telegram?.WebApp?.viewportHeight || window.innerHeight;
  }

  /**
   * Получить стабильную высоту вьюпорта
   */
  getViewportStableHeight(): number {
    return window.Telegram?.WebApp?.viewportStableHeight || window.innerHeight;
  }

  /**
   * Получить цветовую схему
   */
  getColorScheme(): 'light' | 'dark' {
    return window.Telegram?.WebApp?.colorScheme || 'light';
  }
}

export default TelegramWebApp.getInstance();
