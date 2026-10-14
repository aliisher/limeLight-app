import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, wp } from '../../Assets/Responsive';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import StaffComparisonTabs from '../../Components/StaffComparisonTabs';
import StaffConversionChartCard from '../../Components/StaffConversionChartCard';
import StaffPerformanceCard from '../../Components/StaffPerformanceCard';
import { Colors } from '../../Constants/Colors';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import Api from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import { mapSalesStaffComparison } from '../../Utils/salesStaffMappers';

const getRangeType = tab => (tab === Strings.weekly ? 'weekly' : 'monthly');

const formatApiDate = date => {
  if (!date) {
    return '';
  }

  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const StaffComparison = props => {
  const insets = useSafeAreaInsets();
  const params = props?.route?.params;
  const title = params?.title ?? props?.title ?? Strings.staffComparisonHeader;

  const [selectedTab, setSelectedTab] = useState(
    params?.selectedTab ?? Strings.weekly,
  );
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [datePickerKey, setDatePickerKey] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [yourData, setYourData] = useState(null);
  const [rankData, setRankData] = useState([]);
  const [topPerformer, setTopPerformer] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConversionLoading, setIsConversionLoading] = useState(false);

  const hasConversionDateRange = Boolean(fromDate && toDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = date => date.toLocaleDateString('en-GB');

  const fetchSalesStaffComparison = useCallback(async () => {
    setIsLoading(true);

    try {
      const type = getRangeType(selectedTab);
      const res = await Api.getSalesStaffComparison(type);
      const resJson = res?.data;
      console.log('staff comparison@@', JSON.stringify(resJson, null, 2));


      if (res?.status == 200) {
        const mapped = mapSalesStaffComparison(resJson?.data ?? resJson);
        setYourData(mapped.yourData);
        setRankData(mapped.rankData);
        setTopPerformer(mapped.topPerformer);
      } else {
        showApiMessageToast(res);
      }
    } catch (error) {
      // Error toast handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  }, [selectedTab]);

  const fetchConversionRate = useCallback(async () => {
    if (!fromDate || !toDate) {
      setConversionData(null);
      return;
    }

    const from = formatApiDate(fromDate);
    const to = formatApiDate(toDate);

    setIsConversionLoading(true);

    try {
      const res = await Api.getConversionRate(from, to);
      const resJson = res?.data;

      if (res?.status == 200) {
        const list = Array.isArray(resJson)
          ? resJson
          : resJson?.chart ?? resJson?.data ?? [];

        setConversionData(list);
      } else {
        showApiMessageToast(res);
        setConversionData([]);
      }
    } catch (error) {
      setConversionData([]);
    } finally {
      setIsConversionLoading(false);
    }
  }, [fromDate, toDate]);

  useFocusEffect(
    useCallback(() => {
      fetchSalesStaffComparison();
    }, [fetchSalesStaffComparison]),
  );

  useEffect(() => {
    fetchConversionRate();
  }, [fetchConversionRate]);

  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (datePickerKey === 'from') {
      setFromDate(selectedDate);
      if (toDate && selectedDate > toDate) {
        setToDate(selectedDate);
      }
    }

    if (datePickerKey === 'to') {
      setToDate(selectedDate);
    }

    setShowPicker(false);
  };

  const openPicker = key => {
    setDatePickerKey(key);
    setShowPicker(true);
  };

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: hp(3) + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled">
        <MainHeaderComponent
          title={title}
          showNotification
        />

        <StaffComparisonTabs
          selectedTab={selectedTab}
          weeklyLabel={Strings.weekly}
          monthlyLabel={Strings.monthly}
          onPressWeekly={() => setSelectedTab(Strings.weekly)}
          onPressMonthly={() => setSelectedTab(Strings.monthly)}
        />

        {isLoading ? (
          <ScreenLoader />
        ) : (
          <StaffPerformanceCard
            topPerformer={topPerformer}
            rankData={rankData}
            yourData={yourData}
            labels={params?.labels ?? Strings}
          />
        )}

        <StaffConversionChartCard
          labels={params?.labels ?? Strings}
          fromDate={fromDate}
          toDate={toDate}
          formatDate={formatDate}
          onPressFrom={() => openPicker('from')}
          onPressTo={() => openPicker('to')}
          transactionSummary={
            hasConversionDateRange ? conversionData : null
          }
          isLoading={isConversionLoading}
        />

        {showPicker && (
          <DateTimePicker
            mode="date"
            value={
              datePickerKey === 'from'
                ? fromDate || today
                : toDate || fromDate || today
            }
            minimumDate={datePickerKey === 'to' ? fromDate || today : undefined}
            maximumDate={datePickerKey === 'from' ? today : undefined}
            display="default"
            onChange={handleDateChange}
          />
        )}
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

export default StaffComparison;
