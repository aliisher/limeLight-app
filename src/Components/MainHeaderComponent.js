import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Images } from '../Assets';
import { hp, wp } from '../Assets/Responsive';
import { Colors } from '../Constants/Colors';
import { Fontsize } from '../Constants/Fontsize';
import { Fonts } from '../Constants/Fonts';
import { navigateToNotification } from '../Navigations/navigationHelpers';
import Api from '../Services/Api_services';
import {
  getUnreadNotificationCount,
  mapNotifications,
} from '../Utils/notificationMappers';

const MainHeaderComponent = props => {
  const navigation = useNavigation();
  const showNotification =
    props.showNotification || props.notificationCount != null;
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await Api.getNotifications();
      const resJson = res?.data ?? {};

      if (res?.status == 200) {
        const mapped = mapNotifications(resJson?.data ?? resJson);
        setNotificationCount(getUnreadNotificationCount(mapped));
      }
    } catch (error) {
      console.log(
        'Header notification count error:',
        error?.response?.data ?? error?.message ?? error,
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!showNotification) {
        return;
      }

      fetchUnreadCount();
    }, [fetchUnreadCount, showNotification]),
  );

  return (
    <View style={[styles.header, props.style]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={Images.LeftArrow}
          style={styles.arrowIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {props?.title}
      </Text>

      {showNotification ? (
        <TouchableOpacity
          style={styles.notification}
          onPress={() => navigateToNotification(navigation)}
        >
          <Image
            source={Images.NotificationBell}
            resizeMode="contain"
            style={styles.bellIcon}
          />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  backBtn: {
    width: wp(7),
    height: wp(7),
    backgroundColor: Colors.green,
    borderRadius: wp(2.3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    width: wp(2),
    height: hp(4),
    tintColor: Colors.white,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.m,
    color: Colors.black,
  },
  notification: {
    width: wp(6.5),
    height: wp(6.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    width: wp(6.5),
    height: wp(6.5),
  },
  badge: {
    position: 'absolute',
    top: -hp(0.7),
    right: -wp(1.2),
    backgroundColor: Colors.red,
    minWidth: wp(4.2),
    height: wp(4.2),
    paddingHorizontal: wp(0.6),
    borderRadius: wp(2.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsSemiBold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  placeholder: {
    width: wp(6.5),
    height: wp(6.5),
  },
});

export default MainHeaderComponent;
