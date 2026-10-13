import { StatusBar, StyleSheet, View } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { MyStyling } from '../../Constants/Styling';
import { Colors } from '../../Constants/Colors';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import { hp, wp } from '../../Assets/Responsive';
import ResponseComponent from '../../Components/ResponseComponent';
import AllResponseComponent from '../../Components/AllResponseComponent';
import { SurveyResponseProvider } from '../../Components/SurveyResponseContext';
import { ROLES } from '../../Constants/roleConfig';
import { useRole } from '../../Context/RoleContext';
import Api, { isApiSuccess } from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import {
  getSurveyResponseStatusParam,
  getUserBranchId,
  logSurveyEvent,
  mapSurveyResponsesResponse,
} from '../../Utils/surveyHelpers';
import { selectActiveSurveyId } from '../../Redux/Slices/SurveySlice';

const SurveyResponse = () => {
  const route = useRoute();
  const { role } = useRole();
  const userData = useSelector(state => state?.AUTH?.userData);
  const activeSurveyId = useSelector(selectActiveSurveyId);
  const isAsm = role === ROLES.ASM;
  const branchId = isAsm
    ? route.params?.branchId ?? null
    : getUserBranchId(userData);
  const surveyId = route.params?.surveyId ?? activeSurveyId ?? null;
  const [summary, setSummary] = useState({
    totalStaff: 0,
    completed: 0,
    pending: 0,
  });
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const requestRef = useRef(null);

  const fetchSurveyResponses = useCallback(
    async status => {
      const resolvedBranchId = branchId;
      const resolvedSurveyId = surveyId;
      const resolvedStatus = status || 'all';

      if (!resolvedBranchId || !resolvedSurveyId) {
        logSurveyEvent('[Survey Responses]', 'Fetch skipped', {
          survey_id: resolvedSurveyId,
          branch_id: resolvedBranchId,
          status: resolvedStatus,
        });
        return;
      }

      const requestKey = `${resolvedSurveyId}-${resolvedBranchId}-${resolvedStatus}`;

      if (requestRef.current === requestKey) {
        return;
      }

      requestRef.current = requestKey;
      setIsLoading(true);

      logSurveyEvent('[Survey Responses]', 'Request', {
        survey_id: resolvedSurveyId,
        branch_id: resolvedBranchId,
        status: resolvedStatus,
        endpoint: `GET /api/surveys/${resolvedSurveyId}/responses?branch_id=${resolvedBranchId}&status=${resolvedStatus}`,
      });

      try {
        const res = await Api.getSurveyResponses(
          resolvedSurveyId,
          resolvedBranchId,
          resolvedStatus,
        );
        console.log('surevey id@@@',surveyId);
        console.log('resolvedbranch id@@@@',resolvedBranchId);

        console.log('resolved status@@@',resolvedStatus);

        
        const resJson = res?.data ?? {};

        if (isApiSuccess(res)) {
          const mapped = mapSurveyResponsesResponse(resJson?.data ?? resJson);

          logSurveyEvent('[Survey Responses]', 'Response', resJson);
          logSurveyEvent('[Survey Responses]', 'Mapped responses', {
            survey: mapped.survey,
            branch: mapped.branch,
            summary: {
              totalStaff: mapped.totalStaff,
              completed: mapped.completed,
              pending: mapped.pending,
            },
            responses: mapped.responses,
          });

          setSummary({
            totalStaff: mapped.totalStaff,
            completed: mapped.completed,
            pending: mapped.pending,
          });
          setResponses(mapped.responses);
        } else {
          logSurveyEvent('[Survey Responses]', 'Error response', resJson);
          showApiMessageToast(res);
          setResponses([]);
        }
      } catch (error) {
        logSurveyEvent('[Survey Responses]', 'Error', {
          survey_id: resolvedSurveyId,
          branch_id: resolvedBranchId,
          status: resolvedStatus,
          message: error?.response?.data ?? error?.message ?? error,
        });
        setResponses([]);
      } finally {
        requestRef.current = null;
        setIsLoading(false);
      }
    },
    [branchId, surveyId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchSurveyResponses(activeStatus);
    }, [activeStatus, fetchSurveyResponses]),
  );

  const handleTabChange = status => {
    const nextStatus = getSurveyResponseStatusParam(status);

    logSurveyEvent('[Survey Responses]', 'Status changed', {
      survey_id: surveyId,
      branch_id: branchId,
      status: nextStatus,
    });
    setActiveStatus(nextStatus);
  };

  return (
    <SurveyResponseProvider value={{ responses, isLoading }}>
      <View style={MyStyling.container2}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.headerWrap}>
          <MainHeaderComponent title={'Survey Response'} showNotification />
        </View>
        <ResponseComponent
          totalStaff={summary.totalStaff}
          completed={summary.completed}
          pending={summary.pending}
        />
        <View style={styles.tabsWrap}>
          <AllResponseComponent onTabChange={handleTabChange} />
        </View>
      </View>
    </SurveyResponseProvider>
  );
};

export default SurveyResponse;

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
  },
  tabsWrap: {
    flex: 1,
  },
});
