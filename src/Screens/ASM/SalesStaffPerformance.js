import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import StaffPerformanceCard from '../../Components/StaffPerformanceCard';
import { hp, wp } from '../../Assets/Responsive';
import { staffComparisonRankData } from '../../Constants/DummyData';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import { Colors } from '../../Constants/Colors';

const SalesStaffPerformance = props => {
  const insets = useSafeAreaInsets();
  const params = props?.route?.params;
  const rankData = params?.rankData ?? staffComparisonRankData;
  const topPerformer = params?.topPerformer ?? rankData?.[1];

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: hp(3) + insets.bottom },
        ]}
      >
        <MainHeaderComponent
          title={params?.title ?? Strings.salesStaffPerformance}
          showNotification
        />
        <StaffPerformanceCard
          topPerformer={topPerformer}
          rankData={rankData}
          labels={params?.labels ?? Strings}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    paddingBottom: hp(3),
  },
});

export default SalesStaffPerformance;
