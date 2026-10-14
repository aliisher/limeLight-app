import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Images } from '../../Assets';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import {
  getEmployeeNameLabel,
  getRoleDisplayLabel,
} from '../../Constants/roleConfig';
import { Strings } from '../../Constants/Strings';
import { useRole } from '../../Context/RoleContext';
import UserAvatarImage from '../../Components/UserAvatarImage';
import { REMOVE_USER_DATA } from '../../Redux/Slices/AuthSlice';
import { selectHasPendingSurveys } from '../../Redux/Slices/SurveySlice';
import Api, { setAuthToken } from '../../Services/Api_services';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';

const DRAWER_BOTTOM_ROUTE = 'BottomNavigation';

const SalesStaffDrawerContent = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const dispatch = useDispatch();

  const { role, setRole } = useRole();

  const userData = useSelector(state => state?.AUTH?.userData);
  const hasPendingSurveys = useSelector(selectHasPendingSurveys);

  const employeeName =
    userData?.name ||
    userData?.user?.name ||
    userData?.data?.name ||
    getEmployeeNameLabel(role);
  const goToTabScreen = (screenName, params) => {
    navigation.navigate(DRAWER_BOTTOM_ROUTE, { screen: screenName, params });
    navigation.closeDrawer();
  };

  const goToAnnouncement = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Announcement');
  };

  const goToProfile = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Profile');
  };

  const goToAppScreen = screenName => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate(screenName);
  };

  const handleLogout = async () => {
    navigation.closeDrawer();

    try {
      const res = await Api.logout();
      const resJson = res?.data;

      console.log('Logout Backend Response:', JSON.stringify(resJson, null, 2));

      if (res?.status == 200) {
        console.log('Logout Response:', JSON.stringify(resJson, null, 2));
        Toast.show(resJson?.message, Toast.LONG);
      } else {
        console.log('Logout Error Response:', JSON.stringify(resJson, null, 2));
        Toast.show(resJson?.message, Toast.LONG);
      }
    } catch (error) {
      console.log(
        'Logout API Error:',
        JSON.stringify(
          error?.response?.data ?? error?.message ?? error,
          null,
          2,
        ),
      );
      Toast.show(error?.response?.data?.message, Toast.LONG);
    }

    setAuthToken(null);
    dispatch(REMOVE_USER_DATA());
    setRole(null);
    navigation
      .getParent()
      ?.getParent()
      ?.reset({
        index: 0,
        routes: [{ name: 'Role' }],
      });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + hp(2) }]}>
      <Pressable
        style={({ pressed }) => [
          styles.profileSection,
          pressed && styles.menuItemPressed,
        ]}
        onPress={goToProfile}
      >
        <View style={styles.avatar}>
          <UserAvatarImage
            userData={userData}
            iconStyle={styles.avatarImage}
          />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {employeeName}
          </Text>
          <Text style={styles.userRole} numberOfLines={1}>
            {getRoleDisplayLabel(role)}
          </Text>
        </View>
      </Pressable>

      <View style={styles.profileDivider} />

      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={[
          styles.menuContent,
          { paddingBottom: hp(3) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MenuItem
          iconName="bar-chart-2"
          label={Strings.staffComparison}
          onPress={() => goToAppScreen('StaffComparison')}
        />
        <MenuItem
          iconName="headphones"
          label={Strings.customerServiceTraining}
          onPress={() =>
            goToTabScreen('Training', { tab: 'Customer', ts: Date.now() })
          }
        />
        <MenuItem
          iconName="package"
          label={Strings.productTraining}
          onPress={() =>
            goToTabScreen('Training', { tab: 'Product', ts: Date.now() })
          }
        />
        <MenuItem
          iconName="grid"
          label={Strings.displayTraining}
          onPress={() =>
            goToTabScreen('Training', { tab: 'Display', ts: Date.now() })
          }
        />
        <MenuItem
          imageSource={Images.MegaAssignment}
          label={Strings.announcements}
          onPress={goToAnnouncement}
        />
        <MenuItem
          iconName="message-square"
          label={Strings.feedback}
          onPress={() => goToTabScreen('FeedBack')}
        />
        {hasPendingSurveys ? (
          <MenuItem
            imageSource={Images.Note}
            label={Strings.surveys}
            onPress={() => goToTabScreen('Survey')}
          />
        ) : null}
        {!hasPendingSurveys ? (
          <MenuItem
            iconName="file-text"
            label={Strings.SurveyReport}
            onPress={() =>
              goToTabScreen('Survey', { screen: 'SurveyReport' })
            }
          />
        ) : null}

        <View style={styles.logoutDivider} />
        <MenuItem
          iconName="log-out"
          label={Strings.logout}
          onPress={handleLogout}
          danger
        />
      </ScrollView>
    </View>
  );
};

const MenuItem = ({ label, onPress, iconName, imageSource, danger }) => (
  <Pressable
    style={({ pressed }) => [
      styles.menuItem,
      pressed && styles.menuItemPressed,
    ]}
    onPress={onPress}
  >
    {iconName ? (
      <Icon
        name={iconName}
        size={wp(5)}
        color={danger ? Colors.brightRed : Colors.slateGrey}
      />
    ) : (
      <Image
        source={imageSource}
        style={styles.menuIcon}
        resizeMode="contain"
      />
    )}
    <Text
      style={[styles.menuLabel, danger && styles.menuLabelDanger]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: wp(5),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
    marginTop: hp(-0.3),
  },
  profileDivider: {
    height: hp(0.15),
    backgroundColor: Colors.lightGrey,
    marginBottom: hp(1.5),
  },
  avatar: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(6.5),
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
  profileInfo: {
    marginLeft: wp(3),
    flex: 1,
  },
  userName: {
    fontSize: Fontsize.m,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
    marginTop: hp(0.6),
  },
  userRole: {
    fontSize: Fontsize.sm,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.grey,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: hp(3),
    marginTop: hp(-0.5),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(1),
    borderRadius: wp(2),
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.slateGrey,
  },
  menuLabel: {
    flex: 1,
    marginLeft: wp(3),
    fontSize: Fontsize.xs3,
    fontFamily: Fonts.poppinsMedium,
    color: Colors.black,
  },
  menuLabelDanger: {
    color: Colors.brightRed,
  },
  logoutDivider: {
    height: hp(0.15),
    backgroundColor: Colors.lightGrey,
    marginVertical: hp(1),
  },
});

export default SalesStaffDrawerContent;
