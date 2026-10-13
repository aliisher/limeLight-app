import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Images } from '../Assets';
import { hp, wp } from '../Assets/Responsive';
import { Colors } from '../Constants/Colors';
import { Fonts } from '../Constants/Fonts';
import { Fontsize } from '../Constants/Fontsize';
import Api from '../Services/Api_services';
import {
  getUnreadNotificationCount,
  mapNotifications,
} from '../Utils/notificationMappers';

const TrainingHeader = () => {
  const navigation = useNavigation();
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
        'Training notification count error:',
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
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={Images.LeftArrow}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Training</Text>

      <TouchableOpacity
        style={styles.bellBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Notification')}
      >
        <Feather name="bell" size={wp(5.5)} color={Colors.black} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  backBtn: {
    width: wp(9),
    height: wp(9),
    backgroundColor: Colors.green,
    borderRadius: wp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: wp(2),
    height: hp(3.5),
    tintColor: Colors.white,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.m,
    color: Colors.black,
  },
  bellBtn: {
    width: wp(9),
    height: wp(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: wp(0.4),
    right: wp(0.6),
    minWidth: wp(4),
    height: wp(4),
    borderRadius: wp(2),
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1),
    borderWidth: 1,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsSemiBold,
  },
});

export default TrainingHeader;
