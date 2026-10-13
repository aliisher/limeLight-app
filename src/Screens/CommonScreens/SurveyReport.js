import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import BranchResponse from '../../Components/BranchResponse';
import SatisficationSurveyComponent from '../../Components/SatisficationSuveyComponent';
import SurveyReportTitle from '../../Components/SurveyReportTitle';
import TotalResponsesCard from '../../Components/TotalResponsesCard';
import ScreenLoader from '../../Components/ScreenLoader';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { MyStyling } from '../../Constants/Styling';
import { ROLES } from '../../Constants/roleConfig';
import { useRole } from '../../Context/RoleContext';
import Api, { isApiSuccess } from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import {
  getUserBranchId,
  getUserBranchName,
  logSurveyEvent,
  mapAsmBranchesResponse,
  mapSurveyReportResponse,
} from '../../Utils/surveyHelpers';
import { selectActiveSurveyId } from '../../Redux/Slices/SurveySlice';

const SurveyReport = () => {
  const route = useRoute();
  const { role } = useRole();
  const userData = useSelector(state => state?.AUTH?.userData);
  const activeSurveyId = useSelector(selectActiveSurveyId);
  const isAsm = role === ROLES.ASM;
  const isStaff = role === ROLES.STAFF;
  const [reportData, setReportData] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [asmBranches, setAsmBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const branchesLoadedRef = useRef(false);
  const reportRequestRef = useRef(null);
  const branchIdRef = useRef(branchId);

  branchIdRef.current = branchId;

  const fetchAsmBranches = useCallback(async () => {
    if (branchesLoadedRef.current && asmBranches.length) {
      return asmBranches;
    }

    logSurveyEvent('[Survey Report]', 'Branches request', {
      endpoint: 'GET /api/asm-branches',
    });

    try {
      const res = await Api.getAsmBranches();
      const resJson = res?.data ?? {};

      if (isApiSuccess(res)) {
        const branches = mapAsmBranchesResponse(resJson);

        logSurveyEvent('[Survey Report]', 'Branches response', resJson);
        logSurveyEvent('[Survey Report]', 'Branches mapped', branches);

        branchesLoadedRef.current = true;
        setAsmBranches(branches);
        return branches;
      }

      logSurveyEvent('[Survey Report]', 'Branches error response', resJson);
      showApiMessageToast(res);
    } catch (error) {
      logSurveyEvent('[Survey Report]', 'Branches error', {
        message: error?.response?.data ?? error?.message ?? error,
      });
    }

    return [];
  }, [asmBranches]);

  const fetchSurveyReport = useCallback(
    async (surveyId, selectedBranchId) => {
      if (!surveyId) {
        logSurveyEvent('[Survey Report]', 'Fetch skipped', {
          survey_id: surveyId,
          branch_id: selectedBranchId ?? null,
        });
        return;
      }

      if (isAsm && !selectedBranchId) {
        logSurveyEvent('[Survey Report]', 'Fetch skipped', {
          survey_id: surveyId,
          branch_id: selectedBranchId ?? null,
        });
        return;
      }

      const requestKey = isAsm
        ? `${surveyId}-${selectedBranchId}`
        : String(surveyId);

      if (reportRequestRef.current === requestKey) {
        return;
      }

      reportRequestRef.current = requestKey;
      setIsLoading(true);

      const endpoint = isAsm
        ? `GET /api/surveys/${surveyId}/report?branch_id=${selectedBranchId}`
        : `GET /api/surveys/${surveyId}/report`;

      logSurveyEvent('[Survey Report]', 'Request', {
        survey_id: surveyId,
        branch_id: isAsm ? selectedBranchId : undefined,
        endpoint,
      });

      try {
        const res = isAsm
          ? await Api.getSurveyReport(surveyId, selectedBranchId)
          : await Api.getSurveyReport(surveyId);
        const resJson = res?.data ?? {};

        if (isApiSuccess(res)) {
          const mapped = mapSurveyReportResponse(resJson?.data ?? resJson);

          logSurveyEvent('[Survey Report]', 'Response', resJson);
          logSurveyEvent('[Survey Report]', 'Mapped report', mapped);

          setReportData(mapped);

          if (!isAsm && mapped.branchName) {
            setBranchName(mapped.branchName);
          }
        } else {
          logSurveyEvent('[Survey Report]', 'Error response', resJson);
          showApiMessageToast(res);
        }
      } catch (error) {
        logSurveyEvent('[Survey Report]', 'Error', {
          survey_id: surveyId,
          branch_id: isAsm ? selectedBranchId : undefined,
          message: error?.response?.data ?? error?.message ?? error,
        });
        setReportData(null);
      } finally {
        reportRequestRef.current = null;
        setIsLoading(false);
      }
    },
    [isAsm],
  );

  const resolveSurveyId = useCallback(
    () => route.params?.surveyId ?? activeSurveyId ?? null,
    [activeSurveyId, route.params?.surveyId],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadReportData = async () => {
        const surveyId = resolveSurveyId();

        if (isAsm) {
          const branches = await fetchAsmBranches();
          if (!active) {
            return;
          }

          const activeBranchId = branchIdRef.current ?? branches?.[0]?.value;

          if (!branchIdRef.current && branches?.[0]) {
            setBranchId(String(branches[0].value));
            setBranchName(branches[0].label);
          }

          if (activeBranchId && surveyId) {
            await fetchSurveyReport(surveyId, activeBranchId);
          }
          return;
        }

        const defaultBranchId = getUserBranchId(userData);
        const defaultBranchName = getUserBranchName(userData);

        if (defaultBranchId && active) {
          if (!branchIdRef.current) {
            setBranchId(String(defaultBranchId));
            setBranchName(defaultBranchName);
          }
        }

        if (surveyId && active) {
          await fetchSurveyReport(surveyId);
        }
      };

      loadReportData();

      return () => {
        active = false;
      };
    }, [
      activeSurveyId,
      fetchAsmBranches,
      fetchSurveyReport,
      isAsm,
      resolveSurveyId,
      route.params?.surveyId,
      userData,
    ]),
  );

  const handleBranchChange = nextBranchId => {
    const selectedBranch = asmBranches.find(
      item => String(item.value) === String(nextBranchId),
    );
    const surveyId = resolveSurveyId();

    logSurveyEvent('[Survey Report]', 'Branch changed', {
      survey_id: surveyId,
      branch_id: nextBranchId,
      branch_name: selectedBranch?.label ?? '',
    });

    setBranchId(String(nextBranchId));
    setBranchName(selectedBranch?.label ?? '');

    if (surveyId) {
      fetchSurveyReport(surveyId, nextBranchId);
    }
  };

  const resolvedBranchName =
    branchName || reportData?.branchName || getUserBranchName(userData);

  const resolvedSurveyId =
    reportData?.surveyId ?? route.params?.surveyId ?? activeSurveyId ?? null;

  return (
    <SafeAreaView style={MyStyling.container2} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.headerWrap}>
        <MainHeaderComponent title="Survey Report" showNotification />
      </View>

      {isLoading && !reportData ? (
        <ScreenLoader />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SurveyReportTitle />
          <BranchResponse
            showDropdown={isAsm}
            branches={asmBranches}
            selectedBranchId={branchId}
            branchName={resolvedBranchName}
            onBranchChange={handleBranchChange}
          />
          <TotalResponsesCard
            branchId={branchId}
            surveyId={resolvedSurveyId}
            responses={reportData?.totalResponses ?? 0}
            total={reportData?.totalStaff ?? 0}
            rate={reportData?.responseRate ?? '0%'}
            disableNavigation={isStaff}
          />
          <SatisficationSurveyComponent
            reportTitle={reportData?.reportTitle}
            title={reportData?.title}
            questions={reportData?.questions}
            responseRate={reportData?.responseRate}
            responses={reportData?.responsesLabel}
            breakdown={reportData?.breakdown}
            status={reportData?.status}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default SurveyReport;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
  },
});
