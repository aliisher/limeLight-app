import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  getMessaging,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import SplashScreen from '../Screens/StartScreens/SplashScreen';
import Role from '../Screens/StartScreens/Role';
import AuthNavigation from './AuthNavigation';
import AppNavigator from './AppNavigator';
import StaffDetail from '../Screens/CommonScreens/StaffDetail';
import TargetAssignment from '../Screens/AppFlow/TargetAssignment';
import BranchTargets from '../Screens/AppFlow/BranchTargets';
import BranchStaffComparison from '../Screens/AppFlow/BranchStaffComparison';
import SurveyResponse from '../Screens/CommonScreens/SurveyResponse';
import {
  markNotificationOpenPending,
  navigationRef,
  openNotificationScreen,
} from './navigationHelpers';
const MAIN_STACK = createNativeStackNavigator();

const MainNavigation = () => {
  useEffect(() => {
    const unsubscribe = onNotificationOpenedApp(getMessaging(), () => {
      markNotificationOpenPending();
      openNotificationScreen();
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        openNotificationScreen();
      }}
    >
      <MAIN_STACK.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{ headerShown: false }}
      >
        <MAIN_STACK.Screen name="SplashScreen" component={SplashScreen} />
        <MAIN_STACK.Screen name="Role" component={Role} />
        <MAIN_STACK.Screen name="AuthNavigation" component={AuthNavigation} />
        <MAIN_STACK.Screen name="StaffDetail" component={StaffDetail} />
        <MAIN_STACK.Screen name="Drawer" component={AppNavigator} />
        <MAIN_STACK.Screen
          name="TargetAssignment"
          component={TargetAssignment}
        />
        <MAIN_STACK.Screen name="BranchTargets" component={BranchTargets} />
        <MAIN_STACK.Screen
          name="BranchStaffComparison"
          component={BranchStaffComparison}
        />
        <MAIN_STACK.Screen name="SurveyResponse" component={SurveyResponse} />
      </MAIN_STACK.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigation;
