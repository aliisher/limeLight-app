const TRAINING_TABS = {
  customer: 'Customer',
  product: 'Product',
  display: 'Display',
};

const normalize = value => String(value ?? '').trim().toLowerCase();

export const isActionableNotification = remoteMessage => {
  const data = remoteMessage?.data;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  return Boolean(normalize(data.type) || normalize(data.source));
};

export const getNotificationMessageKey = remoteMessage => {
  const data = remoteMessage?.data ?? {};

  return [
    data.source,
    data.type,
    data.announcement_id,
    data.training_id,
    data.notification_id,
    data.training_type,
  ]
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
    .join('|');
};

const trainingScreenParams = trainingType => {
  const tab = TRAINING_TABS[normalize(trainingType)];

  return {
    screen: 'BottomNavigation',
    params: {
      screen: 'BottomNavigation',
      params: {
        screen: 'Training',
        ...(tab ? { params: { tab } } : {}),
      },
    },
  };
};

const notificationScreenParams = {
  screen: 'BottomNavigation',
  params: {
    screen: 'BottomNavigation',
    params: {
      screen: 'Notification',
    },
  },
};

export const getNotificationNavigationParams = remoteMessage => {
  if (!isActionableNotification(remoteMessage)) {
    return null;
  }

  const data = remoteMessage.data;
  const type = normalize(data.type);
  const source = normalize(data.source);

  if (type === 'announcement' || source === 'announcement') {
    return { screen: 'Announcement' };
  }

  if (type === 'training module' || source === 'training') {
    return trainingScreenParams(data.training_type);
  }

  if (type === 'notification' || source === 'admin_notification') {
    return notificationScreenParams;
  }

  return notificationScreenParams;
};
