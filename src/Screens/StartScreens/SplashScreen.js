import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  getInitialNotification,
  getMessaging,
} from '@react-native-firebase/messaging';
import SplashView from '../../Components/SplashView';
import { setAuthToken } from '../../Services/Api_services';
import { NOTIFICATION_SCREEN_PARAMS } from '../../Navigations/navigationHelpers';

const SplashScreen = () => {
  const navigation = useNavigation();
  const userData = useSelector(state => state?.AUTH?.userData);
  const role = useSelector(state => state?.ROLE?.userData);
  const token = userData?.token;

  useEffect(() => {
    let cancelled = false;

    if (token) {
      setAuthToken(token);
    }

    const initialNotification = getInitialNotification(getMessaging()).catch(
      () => null,
    );

    const timer = setTimeout(async () => {
      const openedFromNotification = Boolean(await initialNotification);

      if (cancelled) {
        return;
      }

      if (token && role) {
        navigation.replace(
          'Drawer',
          openedFromNotification ? NOTIFICATION_SCREEN_PARAMS : undefined,
        );
        return;
      }

      if (role) {
        navigation.replace('AuthNavigation');
        return;
      }

      navigation.replace('Role');
    }, token && role ? 1200 : 4500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation, role, token]);

  return <SplashView />;
};

export default SplashScreen;
