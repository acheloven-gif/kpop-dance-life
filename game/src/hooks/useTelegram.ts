import { useEffect, useState } from 'react';
import telegramWebApp from '../utils/telegramUtils';

/**
 * Хук для работы с Telegram Web App
 */
export function useTelegram() {
  const [isReady, setIsReady] = useState(telegramWebApp.isInitialized());
  const [user, setUser] = useState(telegramWebApp.getUser());
  const [colorScheme, setColorScheme] = useState(telegramWebApp.getColorScheme());

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const handleThemeChange = () => {
        setColorScheme(window.Telegram!.WebApp!.colorScheme);
      };

      window.Telegram.WebApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        window.Telegram?.WebApp?.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, []);

  return {
    isReady,
    user,
    userName: telegramWebApp.getUserName(),
    userId: telegramWebApp.getUserId(),
    colorScheme,
    isDarkMode: colorScheme === 'dark',
    telegramWebApp,
  };
}

/**
 * Хук для сохранения и загрузки данных в Telegram CloudStorage
 */
export function useTelegramStorage(key: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedData = await telegramWebApp.loadData(key);
        setData(loadedData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key]);

  const saveData = async (newData: any) => {
    try {
      setLoading(true);
      await telegramWebApp.saveData(key, newData);
      setData(newData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async () => {
    try {
      setLoading(true);
      await telegramWebApp.deleteData(key);
      setData(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, saveData, deleteData };
}
