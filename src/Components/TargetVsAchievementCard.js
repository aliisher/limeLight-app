import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import LabeledProgressBar from './LabeledProgressBar';
import { hp, wp } from '../Assets/Responsive';
import { Colors } from '../Constants/Colors';
import {
  accessoriesTarget,
  garmentsTarget,
  unstitchedTarget,
} from '../Constants/DummyData';
import { Fontsize } from '../Constants/Fontsize';
import { Fonts } from '../Constants/Fonts';
import { Strings } from '../Constants/Strings';

const defaultTargetData = [garmentsTarget, unstitchedTarget, accessoriesTarget];

const ProgressRow = props => {
  const remaining = props.remaining ?? 100 - props.achieved;

  return (
    <View style={styles.progressRow}>
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {props.categoryName}
      </Text>
      <LabeledProgressBar
        progress={props.achieved / 100}
        achieved={props.achieved}
        color={props.barColor}
        unfilledColor={Colors.darkNavy}
        remainingText={remaining + Strings.percentRemaining}
        remainingTextColor={Colors.white}
      />
    </View>
  );
};

const TargetVsAchievementCard = ({
  items = defaultTargetData,
  isLoading,
  emptyMessage,
}) => (
  <View style={styles.card}>
    <Text style={styles.title} numberOfLines={1}>
      {Strings.targetVsAchievement}
    </Text>
    <Text style={styles.subtitle} numberOfLines={1}>
      {Strings.targetVsAchievementSub}
    </Text>

    {isLoading ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={Colors.white} size="small" />
      </View>
    ) : emptyMessage ? (
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
    ) : (
      <View style={styles.progressList}>
        {items.map((item, index) => (
          <ProgressRow
            key={item.id ?? item.categoryName ?? String(index)}
            {...item}
          />
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkNavy,
    borderRadius: wp(7.5),
    paddingHorizontal: wp(5),
    paddingTop: hp(2.2),
    paddingBottom: hp(2.9),
    marginTop: -hp(0.25),
    marginBottom: hp(2),
  },
  title: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.mm,
    color: Colors.white,
    marginTop: -hp(0),
  },
  subtitle: {
    fontFamily: Fonts.poppinsBold,
    marginTop: hp(0),
    marginBottom: hp(2),
    color: Colors.blueGrey,
    fontSize: Fontsize.xs1,
  },
  loaderContainer: {
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.s,
    color: Colors.white,
    textAlign: 'center',
    paddingVertical: hp(1.5),
  },
  progressList: {
    gap: hp(2.5),
  },
  progressRow: {
    gap: hp(1),
  },
  categoryLabel: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.xs2,
    color: Colors.white,
  },
});

export default TargetVsAchievementCard;
