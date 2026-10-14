import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp } from '../Assets/Responsive';

const TAB_BAR_HEIGHT = hp(9.5);
const TAB_BAR_PADDING_BOTTOM = hp(0.8);

export const useSafeBottomTabBarStyle = baseStyle => {
  const { bottom } = useSafeAreaInsets();

  return [
    baseStyle,
    {
      height: TAB_BAR_HEIGHT + bottom,
      paddingBottom: TAB_BAR_PADDING_BOTTOM + bottom,
    },
  ];
};
