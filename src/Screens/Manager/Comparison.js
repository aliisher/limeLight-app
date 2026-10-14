import React, { useCallback, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ASMAchievementCard from '../../Components/ASMAchievementCard';
import ASMRangeToggle from '../../Components/ASMRangeToggle';
import BranchStaffComparisonTable from '../../Components/BranchStaffComparisonTable';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fonts } from '../../Constants/Fonts';
import { Fontsize } from '../../Constants/Fontsize';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import Api from '../../Services/Api_services';
import {
  mapBranchManagerBranchComparison,
  mapBranchManagerStaffComparison,
} from '../../Utils/branchManagerMappers';
import { navigateToStaffDetail } from '../../Navigations/navigationHelpers';
import { showApiMessageToast } from '../../Utils/apiHelpers';

const OPTIMIZE_URL = 'https://ranglerz.click/limelight/optimize-project';

const isNotFoundError = error => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  return (
    status === 404 ||
    data?.exception?.includes('NotFoundHttpException')
  );
};

const logApi404Fix = (label, endpoint) => {
  console.log(
    `${label} — 404 Fix:\n` +
    `1. Browser kholo: ${OPTIMIZE_URL}\n` +
    `2. "Optimization Commands Executed Successfully" message aana chahiye\n` +
    `3. App reload karo (Metro: r) aur screen dubara kholo\n` +
    `4. Agar phir bhi 404 aaye to backend se deploy karwao:\n` +
    `GET https://ranglerzbeta.in/limelight/api/${endpoint}`,
  );
};

const EMPTY_TEAM_ROW = { rank: 0, name: '', achieved: 0, remaining: 0 };

const getRangeType = range => (range === Strings.weekly ? 'weekly' : 'monthly');

const Comparison = props => {
  const params = props?.route?.params;
  const insets = useSafeAreaInsets();
  const [selectedRange, setSelectedRange] = useState(
    params?.selectedRange ?? Strings.weekly,
  );
  const [staffData, setStaffData] = useState([]);
  const [garmentsData, setGarmentsData] = useState([]);
  const [unstitchedData, setUnstitchedData] = useState([]);
  const [accessoriesData, setAccessoriesData] = useState([]);
  const [garmentsYoursRow, setGarmentsYoursRow] = useState(EMPTY_TEAM_ROW);
  const [unstitchedYoursRow, setUnstitchedYoursRow] = useState(EMPTY_TEAM_ROW);
  const [accessoriesYoursRow, setAccessoriesYoursRow] = useState(EMPTY_TEAM_ROW);
  const [isLoading, setIsLoading] = useState(false);

  const goToStaffDetail = member => {
    navigateToStaffDetail(props?.navigation, member);
  };

  const fetchStaffComparison = useCallback(async () => {
    try {
      const type = getRangeType(selectedRange);
      console.log('branch manager staff type', type);

      const res = await Api.getBranchManagerStaffComparison(type);
      const resJson = res?.data;

      console.log(
        'Branch Manager Staff Comparison Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'Branch Manager Staff Comparison Response:',
          JSON.stringify(resJson, null, 2),
        );

        const rawData = resJson?.data ?? [];
        const appResponse = mapBranchManagerStaffComparison(rawData);
        setStaffData(appResponse);
      } else {
        console.log(
          'Branch Manager Staff Comparison Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        logApi404Fix(
          'Branch Manager Staff Comparison',
          'branch-manager-staff-comparison',
        );
      }

      console.log(
        'Branch Manager Staff Comparison API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    }
  }, [selectedRange]);

  const fetchBranchComparison = useCallback(async () => {
    try {
      const type = getRangeType(selectedRange);
      const res = await Api.getBranchManagerBranchComparison(type);
      const resJson = res?.data;

      console.log(
        'Branch Manager Branch Comparison Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'Branch Manager Branch Comparison Response:',
          JSON.stringify(resJson, null, 2),
        );

        const appResponse = mapBranchManagerBranchComparison(resJson?.data);
        setGarmentsData(appResponse.garmentsData);
        setUnstitchedData(appResponse.unstitchedData);
        setAccessoriesData(appResponse.accessoriesData);
        setGarmentsYoursRow(appResponse.garmentsYoursRow);
        setUnstitchedYoursRow(appResponse.unstitchedYoursRow);
        setAccessoriesYoursRow(appResponse.accessoriesYoursRow);
      } else {
        console.log(
          'Branch Manager Branch Comparison Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        logApi404Fix(
          'Branch Manager Branch Comparison',
          'branch-manager-branch-comparison',
        );
      }

      console.log(
        'Branch Manager Branch Comparison API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    }
  }, [selectedRange]);

  const fetchComparisonData = useCallback(async () => {
    setIsLoading(true);

    try {
      await Promise.all([fetchStaffComparison(), fetchBranchComparison()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStaffComparison, fetchBranchComparison]);

  useFocusEffect(
    useCallback(() => {
      fetchComparisonData();
    }, [fetchComparisonData]),
  );

  return (
    <View style={MyStyling.container2}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
        translucent={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: hp(3) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MainHeaderComponent
          title={params?.title ?? Strings.comparison}
          showNotification
        />

        {isLoading ? (
          <ScreenLoader />
        ) : (
          <>
            <ASMRangeToggle
              selectedRange={selectedRange}
              onSelectRange={setSelectedRange}
            />

            <BranchStaffComparisonTable
              staff={staffData}
              onStaffPress={goToStaffDetail}
            />

            <Text style={styles.sectionHeading} numberOfLines={1}>
              {Strings.branchComparison}
            </Text>
            <View style={styles.achievementGroup}>
              <ASMAchievementCard
                title={Strings.asmGarments}
                data={garmentsData}
                accentColor="#20C997"
                yoursRow={garmentsYoursRow}
              />
              <ASMAchievementCard
                title={Strings.asmUnstitched}
                data={unstitchedData}
                accentColor={Colors.brightBlue}
                yoursRow={unstitchedYoursRow}
              />
              <ASMAchievementCard
                title={Strings.asmAccessories}
                data={accessoriesData}
                accentColor={Colors.vividAmber}
                yoursRow={accessoriesYoursRow}
                isLast
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(3),
    backgroundColor: Colors.white,
  },
  sectionHeading: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.sm,
    color: Colors.black,
    marginTop: hp(2),
    marginBottom: hp(1.2),
  },
  achievementGroup: {
    borderWidth: 1,
    borderColor: '#A89C9C',
    borderRadius: wp(4),
    paddingHorizontal: wp(2.5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
    marginBottom: hp(2),
    backgroundColor: '#F5FAFF',
  },
});

export default Comparison;
