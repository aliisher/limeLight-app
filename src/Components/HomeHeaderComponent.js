import React, { useCallback, useState } from 'react';

import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DrawerMenuButton from './DrawerMenuButton';
import UserAvatarImage from './UserAvatarImage';

import { Images } from '../Assets';

import { hp, wp } from '../Assets/Responsive';

import { Colors } from '../Constants/Colors';

import { Fontsize } from '../Constants/Fontsize';

import { Fonts } from '../Constants/Fonts';

import {
  getEmployeeNameLabel,
  getHomeBranchLabel,
} from '../Constants/roleConfig';

import { useRole } from '../Context/RoleContext';

import {
  navigateToNotification,
  navigateToProfile,
} from '../Navigations/navigationHelpers';
import { useSelector } from 'react-redux';
import Api from '../Services/Api_services';
import {
  getUnreadNotificationCount,
  mapNotifications,
} from '../Utils/notificationMappers';

const HomeHeaderComponent = ({ userName }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userData = useSelector(state => state?.AUTH?.userData);
  const { role } = useRole();
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
        'Home notification count error:',
        error?.response?.data ?? error?.message ?? error,
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  return (
    <View style={[styles.header, { paddingTop: hp(3) + insets.top }]}>
      <DrawerMenuButton iconColor={Colors.white} style={styles.menuBtn} />

      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {userName || getEmployeeNameLabel(role)}
        </Text>

        <Text style={styles.userBranch} numberOfLines={1}>
          {getHomeBranchLabel(role)}
        </Text>
      </View>

      <View style={styles.rightActions}>
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

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigateToProfile(navigation)}
        >
          <UserAvatarImage
            userData={userData}
            iconStyle={styles.avatarImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.darkNavy,
    paddingHorizontal: wp(4),
    paddingTop: hp(3),
    paddingBottom: hp(1.8),
  },

  menuBtn: {
    marginRight: wp(2.5),
    marginTop: hp(0.3),
  },

  userInfo: {
    flex: 1,
    marginRight: wp(2),
    paddingTop: hp(0.5),
  },

  userName: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.mm,
    color: Colors.white,
  },

  userBranch: {
    fontFamily: Fonts.poppinsRegular,
    fontSize: wp(3),
    color: Colors.ashGray,
    marginTop: hp(0.2),
  },

  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: wp(3),
  },

  notification: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: Colors.dimGray,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bellIcon: {
    width: wp(6),
    height: wp(7),
    tintColor: Colors.white,
  },

  badge: {
    position: 'absolute',
    top: wp(0.6),
    right: wp(2),
    backgroundColor: Colors.red,
    width: wp(3.5),
    height: wp(3.5),
    borderRadius: wp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: Colors.white,
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsSemiBold,
  },

  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: wp(5),
    height: hp(2.8),
    tintColor: Colors.white,
  },
});

export default HomeHeaderComponent;
