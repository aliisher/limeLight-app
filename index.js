/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  console.log('FCM background message:', JSON.stringify(remoteMessage));
});

AppRegistry.registerComponent(appName, () => App);
