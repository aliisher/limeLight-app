import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { Images } from '../../Assets';
import Btn from '../../Components/Btn';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import SurveyProgressBar from '../../Components/SurveyProgressBar';
import SurveyQuestionCard from '../../Components/SurveyQuestionCard';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import {
  markSurveySubmitted,
  setActiveSurveyId,
  setHasPendingSurveys,
} from '../../Redux/Slices/SurveySlice';
import Api, { isApiSuccess } from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import {
  buildSurveySubmitFormData,
  buildSurveySubmitPayload,
  getSurveyOptionColor,
  logSurveyEvent,
  mapSurveyDetailResponse,
  mapSurveyListResponse,
} from '../../Utils/surveyHelpers';

const normalizeSelectedOption = option => {
  if (!option) {
    return null;
  }

  if (typeof option === 'string') {
    return {
      optionId: null,
      label: option,
    };
  }

  return {
    optionId: option?.id ?? option?.option_id ?? null,
    label: option?.label ?? '',
  };
};

const SurveyProgress = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const fetchKeyRef = useRef(null);
  const [answers, setAnswers] = useState({});
  const [surveyId, setSurveyId] = useState(route.params?.surveyId ?? null);
  const [surveyTitle, setSurveyTitle] = useState(
    route.params?.surveyTitle ?? Strings.priceSatisfactionSurvey,
  );
  const [progressLabel, setProgressLabel] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSelectedLabel, setLastSelectedLabel] = useState('');

  const redirectToSurveyReport = useCallback(() => {
    navigation.navigate('BottomNavigation', {
      screen: 'BottomNavigation',
      params: {
        screen: 'Survey',
        params: { screen: 'SurveyReport' },
      },
    });
  }, [navigation]);

  const fetchSurveyDetail = useCallback(async () => {
    const activeSurveyId = route.params?.surveyId ?? surveyId;

    if (activeSurveyId == null) {
      logSurveyEvent('[Survey Detail]', 'Missing survey_id', {});
      setQuestions([]);
      return;
    }

    const requestKey = String(activeSurveyId);

    if (fetchKeyRef.current === requestKey) {
      return;
    }

    fetchKeyRef.current = requestKey;
    setIsLoading(true);

    logSurveyEvent('[Survey Detail]', 'Request', {
      survey_id: activeSurveyId,
      endpoint: `GET /api/surveys/${activeSurveyId}`,
    });

    try {
      const res = await Api.getSurveyDetail(activeSurveyId);
      const resJson = res?.data ?? {};

      if (isApiSuccess(res)) {
        const mapped = mapSurveyDetailResponse(resJson);

        logSurveyEvent('[Survey Detail]', 'Response', resJson);
        logSurveyEvent('[Survey Detail]', 'Mapped detail', mapped);

        setSurveyId(activeSurveyId);
        setSurveyTitle(route.params?.surveyTitle ?? mapped.title);
        setProgressLabel(mapped.progressLabel);
        setQuestions(mapped.questions);
        setAnswers(mapped.initialAnswers ?? {});
        setLastSelectedLabel('');
        dispatch(setActiveSurveyId(activeSurveyId));
      } else {
        logSurveyEvent('[Survey Detail]', 'Error response', resJson);
        showApiMessageToast(res);
        setQuestions([]);
      }
    } catch (error) {
      logSurveyEvent('[Survey Detail]', 'Error', {
        survey_id: activeSurveyId,
        message: error?.response?.data ?? error?.message ?? error,
      });
      setQuestions([]);
    } finally {
      fetchKeyRef.current = null;
      setIsLoading(false);
    }
  }, [dispatch, route.params?.surveyId, route.params?.surveyTitle, surveyId]);

  useFocusEffect(
    useCallback(() => {
      fetchSurveyDetail();
    }, [fetchSurveyDetail]),
  );

  const requiredQuestions = useMemo(
    () => questions.filter(item => item.isRequired !== false),
    [questions],
  );

  const answeredCount = requiredQuestions.filter(item => answers[item.id]).length;
  const allAnswered =
    requiredQuestions.length > 0 && answeredCount === requiredQuestions.length;

  const progressColor = useMemo(
    () => getSurveyOptionColor(lastSelectedLabel),
    [lastSelectedLabel],
  );

  const handleSelectOption = (questionId, option) => {
    const normalized = normalizeSelectedOption(option);

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        optionId: normalized?.optionId,
        label: normalized?.label,
      },
    }));
    setLastSelectedLabel(normalized?.label ?? '');

    logSurveyEvent('[Survey Detail]', 'Answer selected', {
      survey_id: surveyId,
      question_id: questionId,
      option_id: normalized?.optionId,
    });
  };

  const handleSubmitSurvey = async () => {
    if (!allAnswered) {
      Toast.show(
        'Please select an option for every question before submitting the survey',
        Toast.LONG,
      );
      return;
    }

    const payload = buildSurveySubmitPayload(answers);
    const hasMissingOptionIds = payload.some(
      item => item.question_id == null || item.option_id == null,
    );

    if (hasMissingOptionIds) {
      Toast.show('Invalid survey options. Please reopen the survey.', Toast.LONG);
      return;
    }

    const activeSurveyId = surveyId ?? route.params?.surveyId;

    if (activeSurveyId == null) {
      Toast.show('Survey not found. Please try again.', Toast.LONG);
      return;
    }

    setIsSubmitting(true);

    logSurveyEvent('[Survey API]', 'Submit payload', {
      survey_id: activeSurveyId,
      endpoint: `POST /api/surveys/${activeSurveyId}/submit`,
      answers: payload,
    });

    try {
      const formData = buildSurveySubmitFormData(answers);
      const res = await Api.submitSurvey(activeSurveyId, formData);
      const resJson = res?.data ?? {};

      if (isApiSuccess(res)) {
        logSurveyEvent('[Survey API]', 'Submit response', resJson);

        dispatch(markSurveySubmitted(activeSurveyId));

        const listRes = await Api.getSurveyQuestions();
        const listJson = listRes?.data ?? {};

        if (isApiSuccess(listRes)) {
          const mappedList = mapSurveyListResponse(listJson);
          dispatch(setHasPendingSurveys(mappedList.hasPendingSurveys));
        } else {
          dispatch(setHasPendingSurveys(false));
        }

        Toast.show(resJson?.message || 'Survey submitted successfully', Toast.LONG);
        redirectToSurveyReport();
      } else {
        logSurveyEvent('[Survey API]', 'Submit error response', resJson);
        showApiMessageToast(res);
      }
    } catch (error) {
      logSurveyEvent('[Survey API]', 'Submit error', {
        survey_id: activeSurveyId,
        message: error?.response?.data ?? error?.message ?? error,
      });
      Toast.show(
        error?.response?.data?.message || 'Unable to submit survey',
        Toast.LONG,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <MainHeaderComponent
          title={Strings.surveyHeader}
          showNotification
        />

        {isLoading ? (
          <ScreenLoader />
        ) : (
          <>
            <SurveyProgressBar
              title={surveyTitle}
              current={answeredCount}
              total={requiredQuestions.length}
              progressLabel={progressLabel}
              color={progressColor}
            />

            {questions.map((item, index) => (
              <SurveyQuestionCard
                key={item.id}
                qLabel={`Q${index + 1}`}
                question={item.question}
                options={item.options}
                selected={answers[item.id]}
                onSelect={option => handleSelectOption(item.id, option)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: hp(3) + insets.bottom }]}>
        <Btn
          title={Strings.submitSurvey}
          icon={Images.SubmitArrow}
          onPress={handleSubmitSurvey}
          loading={isSubmitting}
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(2),
  },
  footer: {
    paddingHorizontal: wp(6),
    paddingBottom: hp(3),
    paddingTop: hp(1),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },
  submitBtn: {
    marginTop: 0,
  },
});

export default SurveyProgress;
