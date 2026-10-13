import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';

import { MyStyling } from '../../Constants/Styling';
import { Colors } from '../../Constants/Colors';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import { Strings } from '../../Constants/Strings';
import { hp, wp } from '../../Assets/Responsive';

import MonthlyTargetCalculator from '../../Components/MonthlyTargetCalculator';
import MonthlyTargetAssignment from '../../Components/MonthlyTargetAssignment';
import Btn from '../../Components/Btn';
import ScreenLoader from '../../Components/ScreenLoader';
import Api from '../../Services/Api_services';
import {
  buildBranchManagerAssignTargetsPayload,
  getAssignTargetsSectionError,
  getAssignTargetsValidationError,
  getCurrentMonthYearLabels,
  isAssignTargetsSuccess,
  mapTargetAssignmentScreenData,
  mapBranchManagerTargetSummary,
  sumAssignmentTargets,
} from '../../Utils/branchManagerMappers';
import {
  showApiMessageToast,
} from '../../Utils/apiHelpers';

const BUTTONS_BOTTOM = 20;

const TargetAssignment = () => {
  const navigation = useNavigation();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [staffRows, setStaffRows] = useState([]);
  const [categoryTargets, setCategoryTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const assignedTotals = useMemo(
    () => sumAssignmentTargets(staffRows),
    [staffRows],
  );

  const targetSummary = useMemo(
    () => mapBranchManagerTargetSummary(categoryTargets, assignedTotals),
    [categoryTargets, assignedTotals],
  );

  const fetchMonthlyTargets = useCallback(async () => {
    setIsLoading(true);

    try {
      const [monthlyRes, staffRes] = await Promise.all([
        Api.getMonthlyTargets(),
        Api.getBranchManagerStaffComparison('weekly'),
      ]);
      const monthlyJson = monthlyRes?.data;
      const staffJson = staffRes?.data;

      console.log(
        'Branch Manager Monthly Targets Backend Response:',
        JSON.stringify(monthlyJson, null, 2),
      );

      console.log(
        'Branch Manager Staff Comparison Backend Response:',
        JSON.stringify(staffJson, null, 2),
      );

      if (monthlyRes?.status == 200) {
        console.log(
          'Branch Manager Monthly Targets Response:',
          JSON.stringify(monthlyJson, null, 2),
        );

        const staffList = staffRes?.status == 200 ? staffJson?.data ?? [] : [];
        const appResponse = mapTargetAssignmentScreenData(
          monthlyJson?.data,
          staffList,
        );

        if (staffRes?.status != 200) {
          console.log(
            'Branch Manager Staff Comparison Error Response:',
            JSON.stringify(staffJson, null, 2),
          );
          showApiMessageToast(staffRes);
        }

        console.log(
          'Branch Manager Target Assignment App Response:',
          JSON.stringify(appResponse, null, 2),
        );

        setStaffRows(appResponse.staff);
        setCategoryTargets(appResponse.categories);
      } else {
        console.log(
          'Branch Manager Monthly Targets Error Response:',
          JSON.stringify(monthlyJson, null, 2),
        );
        showApiMessageToast(monthlyRes);
        setStaffRows([]);
        setCategoryTargets([]);
      }
    } catch (error) {
      console.log(
        'Branch Manager Monthly Targets API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
      setStaffRows([]);
      setCategoryTargets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMonthlyTargets();
    }, [fetchMonthlyTargets]),
  );

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleUpdateField = (id, field, value) => {
    setStaffRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleReset = () => {
    setStaffRows(prev =>
      prev.map(row => ({
        ...row,
        garments: '',
        unstitched: '',
        accessories: '',
      })),
    );
  };

  const handleSaveTargets = async () => {
    const { month, year } = getCurrentMonthYearLabels();
    const validationError = getAssignTargetsValidationError(staffRows);

    if (validationError) {
      Toast.show(validationError, Toast.LONG);
      return;
    }

    const sectionError = getAssignTargetsSectionError(
      categoryTargets,
      assignedTotals,
    );

    if (sectionError) {
      Toast.show(sectionError, Toast.LONG);
      return;
    }

    const payload = buildBranchManagerAssignTargetsPayload(staffRows, month, year);

    setIsSaving(true);

    try {
      console.log(
        'BranchManagerTarget Request:',
        JSON.stringify(payload, null, 2),
      );

      const res = await Api.assignBranchManagerTargets(payload);
      const resJson = res?.data;

      console.log(
        'BranchManagerTarget Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'BranchManagerTarget Response:',
          JSON.stringify(resJson, null, 2),
        );

        if (isAssignTargetsSuccess(resJson)) {
          Toast.show(resJson?.message || 'Targets saved successfully', Toast.LONG);
          handleReset();
          navigation.goBack();
        } else {
          console.log(
            'BranchManagerTarget Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(resJson?.message || 'Unable to save targets', Toast.LONG);
        }
      } else {
        console.log(
          'BranchManagerTarget Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'BranchManagerTarget API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
      showApiMessageToast(null, error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.headerWrap}>
        <MainHeaderComponent
          title={Strings.TargetAssignment}
          showNotification
        />
      </View>

      {isLoading ? (
        <ScreenLoader />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <MonthlyTargetCalculator summary={targetSummary} />

          <MonthlyTargetAssignment
            rows={staffRows}
            onUpdateField={handleUpdateField}
          />
        </ScrollView>
      )}

      <View
        style={[styles.bottomButtons, { bottom: BUTTONS_BOTTOM - keyboardHeight }]}>
        <Btn
          title="↺ Reset"
          style={styles.resetBtn}
          onPress={handleReset}
          disabled={isSaving}
        />

        <Btn
          title="Save Targets"
          style={styles.saveBtn}
          onPress={handleSaveTargets}
          loading={isSaving}
        />
      </View>
    </SafeAreaView>
  );
};

export default TargetAssignment;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
  },
  scroll: {
    flex: 1,
    paddingHorizontal: wp(6),
  },
  scrollContent: {
    paddingTop: hp(1),
    paddingBottom: hp(14),
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
  },

  resetBtn: {
    flex: 1,
    backgroundColor: '#000',
    marginRight: 8,
    marginTop: 0,
  },

  saveBtn: {
    flex: 1,
    backgroundColor: '#1FA58A',
    marginLeft: 8,
    marginTop: 0,
  },
});
