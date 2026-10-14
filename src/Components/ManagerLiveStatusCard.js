import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Images } from '../Assets';
import { hp, wp } from '../Assets/Responsive';
import { Colors } from '../Constants/Colors';
import { Fontsize } from '../Constants/Fontsize';
import { Fonts } from '../Constants/Fonts';
import { Strings } from '../Constants/Strings';

const EMPTY_SUMMARY = {
  branchMonthlyTarget: 0,
  achieved: 0,
  remaining: 0,
  commission: 0,
  achievedPercent: 0,
  remainingPercent: 100,
};

const clampPercent = value => {
  const parsedValue = parseFloat(value);
  if (!Number.isFinite(parsedValue)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(parsedValue)));
};

const StatItem = ({ label, value, alignRight = false }) => (
  <View style={[styles.statItem, alignRight && styles.statItemRight]}>
    <Text
      style={[styles.statLabel, alignRight && styles.statTextRight]}
      numberOfLines={1}
    >
      {label}
    </Text>
    <Text
      style={[styles.statValue, alignRight && styles.statTextRight]}
      numberOfLines={1}
    >
      {value ?? 0}
    </Text>
  </View>
);

const ManagerLiveStatusCard = ({ data }) => {
  console.log('data@@', JSON.stringify(data, null, 2));

  const summary = data ?? EMPTY_SUMMARY;

  const achievedPercent = clampPercent(
    summary?.achievedPercent ??
    summary?.achievedPercentage ??
    summary?.achieved_percentage ??
    summary?.percentageAchieved ??
    summary?.percentage_achieved ??
    0,
  );

  const remainingValue =
    summary?.remainingPercent ??
    summary?.remainingPercentage ??
    summary?.remaining_percentage ??
    summary?.percentageRemaining ??
    summary?.percentage_remaining;

  const remainingPercent = clampPercent(
    remainingValue != null && remainingValue !== ''
      ? remainingValue
      : 100 - achievedPercent,
  );

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.liveStatus}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText} numberOfLines={1}>
            {Strings.liveStatus}
          </Text>
        </View>
        <Image
          source={Images.LiveStatus}
          style={styles.liveStatusIcon}
          resizeMode="contain"
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatItem
            label={Strings.branchMonthlyTarget}
            value={summary?.branchMonthlyTarget}
          />
          <StatItem
            label={Strings.achievedLabel}
            value={summary?.achieved}
            alignRight
          />
        </View>
        <View style={styles.statsRow}>
          <StatItem label={Strings.remainingLabel} value={summary?.remaining} />
          <StatItem
            label={Strings.commission}
            value={summary?.commission}
            alignRight
          />
        </View>
      </View>

      <View style={styles.combinedBar}>
        {achievedPercent > 0 ? (
          <View
            style={[
              styles.achievedFill,
              {
                width: `${achievedPercent}%`,
              },
            ]}
          >
            <Text
              style={styles.achievedBarText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {`${achievedPercent}% Achieved`}
            </Text>
          </View>
        ) : null}

        <View style={styles.remainingTextContainer} pointerEvents="none">
          <Text
            style={styles.remainingBarText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {`${remainingPercent}% Remaining`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkNavy,
    borderRadius: wp(5),
    paddingHorizontal: wp(4.5),
    paddingTop: hp(2),
    paddingBottom: hp(2.2),
    marginBottom: hp(2.5),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  liveDot: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.emerald,
  },
  liveText: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xs1,
    color: Colors.emerald,
  },
  liveStatusIcon: {
    width: wp(3.5),
    height: wp(3.5),
  },
  statsGrid: {
    marginBottom: hp(2),
    gap: hp(1.8),
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
  },
  statItemRight: {
    alignItems: 'flex-end',
    paddingRight: wp(3),
  },
  statTextRight: {
    textAlign: 'right',
  },
  statLabel: {
    fontFamily: Fonts.poppinsBold,
    fontSize: wp(3.1),
    color: Colors.white,
    marginBottom: hp(0.3),
  },
  statValue: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.mm,
    color: Colors.white,
  },
  combinedBar: {
    width: '100%',
    height: hp(3.1),
    borderRadius: hp(1.55),
    backgroundColor: Colors.darkSlate,
    overflow: 'hidden',
    position: 'relative',
  },
  achievedFill: {
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: hp(1.55),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },
  achievedBarText: {
    width: '100%',
    paddingHorizontal: wp(1),
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.xm2,
    color: Colors.white,
    textAlign: 'left',
    marginLeft:wp(1),
  },
  remainingTextContainer: {
    position: 'absolute',
    right: wp(2),
    top: 0,
    bottom: 0,
    maxWidth: '55%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 3,
  },
  remainingBarText: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.xm2,
    color: Colors.white,
    textAlign: 'right',
  },
});

export default ManagerLiveStatusCard;
