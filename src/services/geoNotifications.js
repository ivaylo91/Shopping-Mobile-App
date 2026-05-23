import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

const STORE_RADIUS_METERS = 400;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function checkNearbyAndNotify(items) {
  if (!items || items.length === 0) return;
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;
    const query = `[out:json];node["shop"~"supermarket|convenience|grocery"](around:${STORE_RADIUS_METERS},${latitude},${longitude});out 3;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.elements?.length) return;
    const storeName = data.elements[0].tags?.name || 'магазин';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Близо до ${storeName}`,
        body: `Имаш ${items.length} ${items.length === 1 ? 'продукт' : 'продукта'} в списъка. Сега е моментът!`,
        data: { type: 'nearby_store', store: storeName },
      },
      trigger: null,
    });
    return storeName;
  } catch {}
}

export async function scheduleShoppingReminder(items, listName) {
  if (!items || items.length === 0) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }
  await cancelShoppingReminders();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Не забравяй за пазаруването!',
      body: `${items.length} ${items.length === 1 ? 'продукт чака' : 'продукта чакат'} в "${listName || 'Моят списък'}"`,
      data: { type: 'shopping_reminder' },
    },
    trigger: { seconds: 30 * 60 },
  });
}

export async function cancelShoppingReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.type === 'shopping_reminder')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {}
}
