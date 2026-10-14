import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import NotificationCard from '../../Components/NotificationCard';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Strings } from '../../Constants/Strings';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { MyStyling } from '../../Constants/Styling';
import {
  navigateToSurveyProgress,
  navigateToSurveyTab,
} from '../../Navigations/navigationHelpers';
import Api from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import {
  getUnreadNotificationCount,
  mapNotifications,
} from '../../Utils/notificationMappers';

const Notification = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [badgeRefreshKey, setBadgeRefreshKey] = useState(0);
  const markingIdsRef = useRef(new Set());

  const unreadCount = getUnreadNotificationCount(notifications);

  const markNotificationRead = useCallback(async item => {
    const id = item?.id;
    const notificationId = id == null ? '' : String(id);

    if (
      !item ||
      item.isRead ||
      !notificationId ||
      notificationId.startsWith('notification-') ||
      markingIdsRef.current.has(notificationId)
    ) {
      return;
    }

    markingIdsRef.current.add(notificationId);

    try {
      await Api.markNotificationRead(notificationId);
      setNotifications(current =>
        current.map(notification =>
          String(notification.id) === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      setBadgeRefreshKey(key => key + 1);
    } catch (error) {
      console.log(
        'Mark notification read error:',
        error?.response?.data ?? error?.message ?? error,
      );
    } finally {
      markingIdsRef.current.delete(notificationId);
    }
  }, []);

  const fetchNotifications = useCallback(async (options = {}) => {
    const { refreshing = false } = options;

    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await Api.getNotifications();
      const resJson = res?.data ?? {};

      if (res?.status == 200) {
        const mapped = mapNotifications(resJson?.data ?? resJson);
        setNotifications(mapped);
        setHasError(false);
      } else {
        showApiMessageToast(res);
        setNotifications([]);
        setHasError(true);
      }
    } catch (error) {
      setNotifications([]);
      setHasError(true);
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const handleRefresh = () => {
    fetchNotifications({ refreshing: true });
  };

  const handleNotificationPress = item => {
    markNotificationRead(item);

    if (item?.category === 'Surveys' || item?.icon === 'Survey') {
      navigateToSurveyTab(navigation);
      return;
    }

    if (item?.category === 'Feedback') {
      navigation.navigate('FeedBack');
      return;
    }

    if (item?.title?.toLowerCase?.().includes('survey')) {
      navigateToSurveyProgress(navigation, {
        surveyTitle: Strings.priceSatisfactionSurvey,
      });
    }
  };

  const unreadLabel = `${unreadCount} Unread`;

  return (
    <View style={MyStyling.container2}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
        translucent={false}
      />

      <FlatList
        data={notifications}
        keyExtractor={item => item?.id}
        renderItem={({ item }) => (
          <NotificationCard item={item} onPress={handleNotificationPress} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.green]}
            tintColor={Colors.green}
          />
        }
        ListHeaderComponent={
          <View>
            <MainHeaderComponent
              title={Strings.notificationHeader}
              showNotification
              unreadRefreshKey={badgeRefreshKey}
            />
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {Strings.recent}
              </Text>
              <Text style={styles.unreadText} numberOfLines={1}>
                {unreadLabel}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ScreenLoader />
          ) : (
            <Text style={styles.emptyText}>
              {hasError
                ? 'Unable to load notifications. Pull to refresh.'
                : Strings.noNotifications}
            </Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    flexGrow: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
    gap: wp(2),
  },
  sectionTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: Fontsize.xs2,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
  },
  unreadText: {
    flexShrink: 0,
    fontSize: Fontsize.xmm,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    marginTop: hp(4),
    paddingHorizontal: wp(4),
    lineHeight: Fontsize.s * 1.4,
  },
});

export default Notification;
