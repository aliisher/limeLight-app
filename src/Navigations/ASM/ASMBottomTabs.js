import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { Images } from '../../Assets';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import HomeTabShell from '../../Components/HomeTabShell';
import ASMHome from '../../Screens/ASM/ASMHome';
import Training from '../../Screens/CommonScreens/Training';
import Notification from '../../Screens/CommonScreens/Notification';
import FeedBack from '../../Screens/CommonScreens/FeedBack';
import SurveyStack from '../SurveyStack';
import { Fontsize } from '../../Constants/Fontsize';
import { useSafeBottomTabBarStyle } from '../safeTabBarStyle';

const BOTTOM_STACK = createBottomTabNavigator();

const styles = StyleSheet.create({
  tabBar: {
    height: hp(9.5),
    paddingTop: hp(0.8),
    paddingBottom: hp(0.8),
    paddingLeft: wp(1),
    paddingRight: wp(1),
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabBarItem: {
    paddingLeft: wp(0),
    paddingRight: wp(0),
  },
  tabBarIcon: {
    width: wp(20),
    height: hp(6.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrap: {
    width: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTabShift: {
    marginLeft: wp(1.5),
  },
  tabContent: {
    width: wp(19.5),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(1.2),
    paddingBottom: hp(1.1),
    paddingLeft: wp(2.2),
    paddingRight: wp(2.2),
    borderRadius: wp(4),
    gap: hp(0.6),
    minHeight: hp(6.2),
  },
  tabIcon: {
    width: wp(6),
    height: hp(3.2),
    marginTop: hp(-0.4),
  },
  tabContentActive: {
    position: 'absolute',
    top: wp(0),
    right: wp(0.8),
    bottom: wp(0),
    left: wp(0.8),
    backgroundColor: Colors.lightGreen,
    borderRadius: wp(4),
  },
  tabLabel: {
    width: wp(16),
    marginTop: hp(0.5),
    fontSize: Fontsize.xm2,
    fontFamily: Fonts.poppinsMedium,
    color: Colors.mediumGrey,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: Colors.green,
  },
});

const tabBarIcon =
  (iconName, label, wrapStyle) =>
  ({ focused }) =>
    (
      <View style={[styles.tabIconWrap, wrapStyle]}>
        <View style={styles.tabContent}>
          {focused && <View style={styles.tabContentActive} />}
          <Icon
            name={iconName}
            size={wp(6)}
            color={focused ? Colors.green : Colors.mediumGrey}
            style={styles.tabIcon}
          />
          <Text
            style={[styles.tabLabel, focused && styles.tabLabelActive]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {label}
          </Text>
        </View>
      </View>
    );

const tabBarImageIcon =
  (imageSource, label, wrapStyle) =>
  ({ focused }) =>
    (
      <View style={[styles.tabIconWrap, wrapStyle]}>
        <View style={styles.tabContent}>
          {focused && <View style={styles.tabContentActive} />}
          <Image
            source={imageSource}
            style={[
              styles.tabIcon,
              { tintColor: focused ? Colors.green : Colors.mediumGrey },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[styles.tabLabel, focused && styles.tabLabelActive]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {label}
          </Text>
        </View>
      </View>
    );

const bottomTabScreenOptions = {
  headerShown: false,
  tabBarShowLabel: false,
  tabBarItemStyle: styles.tabBarItem,
  tabBarIconStyle: styles.tabBarIcon,
  tabBarPressColor: 'transparent',
  tabBarActiveBackgroundColor: 'transparent',
  tabBarInactiveBackgroundColor: 'transparent',
  tabBarButton: props => <TouchableOpacity {...props} activeOpacity={1} />,
};

const ASMBottomTabs = () => {
  const tabBarStyle = useSafeBottomTabBarStyle(styles.tabBar);

  return (
  <BOTTOM_STACK.Navigator
    initialRouteName="Home"
    screenOptions={{ ...bottomTabScreenOptions, tabBarStyle }}
  >
    <BOTTOM_STACK.Screen
      name="Home"
      component={ASMHome}
      options={{
        tabBarIcon: tabBarIcon('home', Strings.home, styles.homeTabShift),
      }}
    />
    <BOTTOM_STACK.Screen
      name="Training"
      component={Training}
      options={{
        tabBarIcon: tabBarIcon('book-open', Strings.training),
      }}
    />
    <BOTTOM_STACK.Screen
      name="Notification"
      component={Notification}
      options={{
        tabBarIcon: tabBarIcon('bell', Strings.alerts),
      }}
    />
    <BOTTOM_STACK.Screen
      name="FeedBack"
      component={FeedBack}
      options={{
        tabBarIcon: tabBarIcon('message-square', Strings.feedback),
      }}
    />
    <BOTTOM_STACK.Screen
      name="Survey"
      component={SurveyStack}
      options={{
        tabBarIcon: tabBarImageIcon(Images.Note, Strings.surveys),
      }}
    />
  </BOTTOM_STACK.Navigator>
  );
};

export default ASMBottomTabs;
