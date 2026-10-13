import { createNavigationContainerRef } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { Strings } from '../Constants/Strings';
import { store } from '../Redux/Store';

export const navigationRef = createNavigationContainerRef();

export const NOTIFICATION_SCREEN_PARAMS = {
  screen: 'BottomNavigation',
  params: {
    screen: 'BottomNavigation',
    params: {
      screen: 'Notification',
    },
  },
};

let pendingNotificationOpen = false;

const canOpenNotificationScreen = () => {
  const state = store.getState();
  const token = state?.AUTH?.userData?.token;
  const role = state?.ROLE?.userData;

  return Boolean(token && role);
};

export const markNotificationOpenPending = () => {
  pendingNotificationOpen = true;
};

export const openNotificationScreen = () => {
  if (!pendingNotificationOpen || !canOpenNotificationScreen() || !navigationRef.isReady()) {
    return false;
  }

  pendingNotificationOpen = false;
  navigationRef.navigate('Drawer', NOTIFICATION_SCREEN_PARAMS);
  return true;
};
import {
  getLastSelectedStaffMember,
  getValidStaffId,
  setLastSelectedStaff,
} from '../Utils/staffHelpers';

const APP_STACK_ROUTE_NAMES = new Set([
  'TargetAssignment',
  'BranchTargets',
  'BranchStaffComparison',
  'StaffComparison',
  'StaffDetail',
  'Announcement',
  'AnnouncementDetail',
  'Profile',
  'ChangePassword',
  'SurveyProgress',
  'SurveyResponse',
]);

export const findNavigatorWithRoute = (navigation, routeName) => {
  let nav = navigation;

  while (nav) {
    const routeNames = nav.getState()?.routeNames ?? [];

    if (routeNames.includes(routeName)) {
      return nav;
    }

    nav = nav.getParent();
  }

  return null;
};

export const resetToRoute = (navigation, routeName) => {
  const nav = findNavigatorWithRoute(navigation, routeName);

  if (!nav) {
    return false;
  }

  nav.reset({
    index: 0,
    routes: [{ name: routeName }],
  });

  return true;
};

export const navigateAfterLogin = navigation => {
  resetToRoute(navigation, 'Drawer');
};

export const navigateToProfile = navigation => {
  if (!navigation) {
    return;
  }

  let nav = navigation;

  while (nav) {
    const routeNames = nav.getState()?.routeNames ?? [];

    if (routeNames.includes('Profile')) {
      nav.navigate('Profile');
      return;
    }

    nav = nav.getParent();
  }
};

export const navigateToStaffDetail = (navigation, member) => {
  const selectedMember = member ?? getLastSelectedStaffMember();
  const staffId = getValidStaffId(selectedMember);

  console.log(
    'Staff Details Navigate:',
    JSON.stringify(
      {
        staffId,
        memberName: selectedMember?.name ?? selectedMember?.staff_name,
        member: selectedMember,
      },
      null,
      2,
    ),
  );

  if (!staffId) {
    console.log(
      'Staff Details Navigate blocked:',
      JSON.stringify(
        {
          reason: 'Missing staff id',
          member: selectedMember,
        },
        null,
        2,
      ),
    );
    Toast.show(Strings.staffDetailMissingId, Toast.LONG);
    return;
  }

  setLastSelectedStaff({ ...selectedMember, staff_id: staffId, id: String(staffId) });

  const params = {
    member: { ...selectedMember, staff_id: staffId, id: String(staffId) },
    staffId,
  };
  const nav = findNavigatorWithRoute(navigation, 'StaffDetail');
  const parentNav = navigation?.getParent?.();

  if (nav) {
    nav.navigate('StaffDetail', params);
    return;
  }

  if (parentNav?.getState?.()?.routeNames?.includes('StaffDetail')) {
    parentNav.navigate('StaffDetail', params);
    return;
  }

  console.log(
    'Staff Details navigation failed:',
    JSON.stringify({ reason: 'StaffDetail route not found' }, null, 2),
  );
};

export const navigateToSurveyTab = navigation => {
  if (!navigation) {
    return;
  }

  const tabNav = findNavigatorWithRoute(navigation, 'Survey');

  const params = { screen: 'SurveyMain' };

  if (tabNav) {
    tabNav.navigate('Survey', params);
    return;
  }

  navigation.navigate('Survey', params);
};

export const navigateToSurveyProgress = (navigation, params = {}) => {
  if (!navigation) {
    return;
  }

  const nav = findNavigatorWithRoute(navigation, 'SurveyProgress');

  if (nav) {
    nav.navigate('SurveyProgress', params);
    return;
  }

  const parentNav = navigation.getParent?.();

  if (parentNav?.getState?.()?.routeNames?.includes('SurveyProgress')) {
    parentNav.navigate('SurveyProgress', params);
  }
};

export const navigateToNotification = navigation => {
  if (!navigation) {
    return;
  }

  let nav = navigation;

  while (nav) {
    const routeNames = nav.getState()?.routeNames ?? [];

    if (routeNames.includes('Notification')) {
      nav.navigate('Notification');
      return;
    }

    if (routeNames.includes('BottomNavigation')) {
      const isAppStack = routeNames.some(name => APP_STACK_ROUTE_NAMES.has(name));

      if (isAppStack) {
        nav.navigate('BottomNavigation', {
          screen: 'BottomNavigation',
          params: { screen: 'Notification' },
        });
      } else {
        nav.navigate('BottomNavigation', { screen: 'Notification' });
      }
      return;
    }

    nav = nav.getParent();
  }
};
