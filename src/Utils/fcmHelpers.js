import { InteractionManager, Linking, PermissionsAndroid, Platform } from 'react-native';
import { getMessaging, getToken, onMessage } from '@react-native-firebase/messaging';
import Toast from 'react-native-simple-toast';

let foregroundListenerAttached = false;

const requestAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (Number(Platform.Version) < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const alreadyGranted = await PermissionsAndroid.check(permission);

  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Notification permission',
    message: 'Allow notifications so you can receive alerts.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  console.log('Android notification permission:', result);

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Toast.show(
      'Notification permission band hai. Settings se allow karein.',
      Toast.LONG,
    );
    Linking.openSettings();
  }

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const attachForegroundListener = messaging => {
  if (foregroundListenerAttached) {
    return;
  }

  foregroundListenerAttached = true;

  onMessage(messaging, async remoteMessage => {
    const title = remoteMessage?.notification?.title ?? 'Notification';
    const body = remoteMessage?.notification?.body ?? '';

    console.log('FCM foreground message:', JSON.stringify(remoteMessage));
    Toast.show(body ? `${title}: ${body}` : title, Toast.LONG);
  });
};

export const requestNotificationPermissionAndGetFcmToken = () =>
  new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(async () => {
        try {
          const allowed = await requestAndroidNotificationPermission();

          if (!allowed) {
            Toast.show(
              'Notification permission denied. Settings se allow karein.',
              Toast.LONG,
            );
          }

          const messaging = getMessaging();
          attachForegroundListener(messaging);

          const token = await getToken(messaging);

          if (token) {
            console.log('FCM Token:', token);
          } else {
            console.log('FCM Token: empty');
          }

          resolve(token || null);
        } catch (error) {
          console.log('FCM setup error:', error?.message ?? error);
          Toast.show('FCM token nahi mila', Toast.LONG);
          resolve(null);
        }
      }, 400);
    });
  });
