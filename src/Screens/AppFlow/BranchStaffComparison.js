import React, { useCallback, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MainHeaderComponent from '../../Components/MainHeaderComponent';
import BranchStaffComparisonCard from '../../Components/BranchStaffComparisonCard';
import ScreenLoader from '../../Components/ScreenLoader';
import StaffComparisonTabs from '../../Components/StaffComparisonTabs';
import { Colors } from '../../Constants/Colors';
import { Strings } from '../../Constants/Strings';
import { hp, wp } from '../../Assets/Responsive';
import { MyStyling } from '../../Constants/Styling';
import Api from '../../Services/Api_services';
import { mapAsmStaffComparison } from '../../Utils/asmMappers';
import {
  showApiMessageToast,
} from '../../Utils/apiHelpers';
import { navigateToStaffDetail } from '../../Navigations/navigationHelpers';

const getRangeType = tab => (tab === Strings.weekly ? 'weekly' : 'monthly');

const BranchStaffComparison = props => {
  const params = props?.route?.params;

  const [branchData, setBranchData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(
    params?.selectedTab ?? Strings.weekly,
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchAsmStaffComparison = useCallback(async () => {
    setIsLoading(true);

    try {
      const type = getRangeType(selectedTab);
      const res = await Api.getAsmStaffComparison(type);
      const resJson = res?.data;

      console.log(
        'ASM Staff Comparison Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'ASM Staff Comparison Response:',
          JSON.stringify(resJson, null, 2),
        );

        const appResponse = mapAsmStaffComparison(resJson?.data);
        setBranchData(appResponse);
        setExpandedId(appResponse[0]?.id ?? null);
      } else {
        console.log(
          'ASM Staff Comparison Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'ASM Staff Comparison API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedTab]);

  useFocusEffect(
    useCallback(() => {
      fetchAsmStaffComparison();
    }, [fetchAsmStaffComparison]),
  );

  const toggleBranch = id => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const goToStaffDetail = member => {
    navigateToStaffDetail(props?.navigation, member);
  };

  const renderBranch = ({ item }) => (
    <BranchStaffComparisonCard
      branch={item}
      isExpanded={expandedId === item?.id}
      onPress={() => toggleBranch(item?.id)}
      onStaffPress={goToStaffDetail}
    />
  );

  return (
    <SafeAreaView style={MyStyling.container2} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.lightGrey} />

      <View style={styles.content}>
        <MainHeaderComponent
          title={params?.title ?? Strings.staffComparisonHeader}
          showNotification
        />

        {isLoading ? (
          <ScreenLoader />
        ) : (
          <FlatList
            data={branchData}
            keyExtractor={item => String(item?.id)}
            renderItem={renderBranch}
            ListHeaderComponent={
              <StaffComparisonTabs
                selectedTab={selectedTab}
                weeklyLabel={Strings.weekly}
                monthlyLabel={Strings.monthly}
                onPressWeekly={() => setSelectedTab(Strings.weekly)}
                onPressMonthly={() => setSelectedTab(Strings.monthly)}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default BranchStaffComparison;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    backgroundColor: Colors.lightGrey,
  },
  list: {
    paddingBottom: wp(1),
  },
});
