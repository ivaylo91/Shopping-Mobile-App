import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

const HANDLER = {
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
};

export async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function sendOverBudgetAlert(listName, overBy) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Над бюджета!',
        body: `"${listName}" надхвърля бюджета с ${overBy.toFixed(2)} €`,
        sound: true,
      },
      trigger: null,
    });
  } catch {}
}

export async function sendListSavedNotification(listName, total) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Списъкът е запазен',
        body: `"${listName}" — ${total.toFixed(2)} €`,
      },
      trigger: null,
    });
  } catch {}
}

export function useNotificationPermission() {
  useEffect(() => {
    try {
      Notifications.setNotificationHandler(HANDLER);
    } catch {}
    requestNotificationPermission();
  }, []);
}
