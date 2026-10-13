import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Images } from '../../Assets';
import Btn from '../../Components/Btn';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import { navigateToSurveyProgress } from '../../Navigations/navigationHelpers';
import {
  setActiveSurveyId,
  setHasPendingSurveys,
} from '../../Redux/Slices/SurveySlice';
import Api, { isApiSuccess } from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import { logSurveyEvent, mapSurveyListResponse } from '../../Utils/surveyHelpers';

const Survey = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSurveys = useCallback(async () => {
    setIsLoading(true);

    logSurveyEvent('[Survey API]', 'Request', {
      endpoint: 'GET /api/surveys',
    });

    try {
      const res = await Api.getSurveyQuestions();
      const resJson = res?.data ?? {};
      console.log('survey response',JSON.stringify(resJson,null,2));
      
      if (isApiSuccess(res)) {
        const mapped = mapSurveyListResponse(resJson);

        logSurveyEvent('[Survey API]', 'Response', resJson);
        logSurveyEvent('[Survey API]', 'Mapped surveys', {
          count: mapped.surveys.length,
          surveys: mapped.surveys,
        });

        setSurveys(mapped.surveys);
        dispatch(setHasPendingSurveys(mapped.hasPendingSurveys));
      } else {
        logSurveyEvent('[Survey API]', 'Error response', resJson);
        showApiMessageToast(res);
        setSurveys([]);
        dispatch(setHasPendingSurveys(false));
      }
    } catch (error) {
      logSurveyEvent('[Survey API]', 'Error', {
        message: error?.response?.data ?? error?.message ?? error,
      });
      setSurveys([]);
    } finally {
      setHasFetched(true);
      setIsLoading(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      console.log('asdfasdf');
      
      fetchSurveys();
    },[fetchSurveys]),
  );

  const handleSurveyPress = survey => {
    if (survey.isSubmitted) {
      logSurveyEvent('[Survey API]', 'Open submitted survey report', {
        survey_id: survey.id,
      });
      dispatch(setActiveSurveyId(survey.id));
      navigation.navigate('SurveyReport', { surveyId: survey.id });
      return;
    }

    logSurveyEvent('[Survey API]', 'Open survey progress', {
      survey_id: survey.id,
    });

    dispatch(setActiveSurveyId(survey.id));
    navigateToSurveyProgress(navigation, {
      surveyId: survey.id,
      surveyTitle: survey.title,
    });
  };

  const renderSurveyCard = ({ item: survey }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconWrap}>
          <Image
            source={Images.Note}
            style={styles.noteIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText} numberOfLines={1}>
            {Strings.active}
          </Text>
        </View>
      </View>

      <Text style={styles.surveyTitle} numberOfLines={2}>
        {survey.title}
      </Text>

      <View style={styles.questionsRow}>
        <Image
          source={Images.Question}
          style={styles.questionIcon}
          resizeMode="contain"
        />
        <Text style={styles.questionsText} numberOfLines={1}>
          {survey.questionsLabel}
        </Text>
      </View>

      <Btn
        title={
          survey.isSubmitted ? Strings.surveySubmitted : Strings.openSurvey
        }
        onPress={() => handleSurveyPress(survey)}
        style={styles.openSurveyBtn}
      />
    </View>
  );

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {isLoading || !hasFetched ? (
        <View style={styles.loaderWrap}>
          <MainHeaderComponent
            title={Strings.surveyHeader}
            showNotification
          />
          <ScreenLoader />
        </View>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={item => `survey-${item.id}`}
          renderItem={renderSurveyCard}
          ListHeaderComponent={
            <MainHeaderComponent
              title={Strings.surveyHeader}
              showNotification
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No survey questions available right now.
            </Text>
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(6),
    flexGrow: 1,
  },
  loaderWrap: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
  },
  loader: {
    marginTop: hp(4),
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(4),
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    elevation: wp(0.5),
    marginBottom: hp(2),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  iconWrap: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(2.5),
    backgroundColor: Colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteIcon: {
    width: wp(5),
    height: wp(5),
  },
  activeBadge: {
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: wp(5),
  },
  activeText: {
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.teal,
    letterSpacing: 0.5,
  },
  surveyTitle: {
    fontSize: Fontsize.l,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.black,
    marginBottom: hp(1),
  },
  questionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionIcon: {
    width: wp(5),
    height: wp(5),
  },
  questionsText: {
    fontSize: Fontsize.xs2,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    marginLeft: wp(1.5),
  },
  openSurveyBtn: {
    marginTop: hp(2),
  },
  emptyText: {
    marginTop: hp(4),
    textAlign: 'center',
    fontSize: Fontsize.sm,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
  },
});

export default Survey;
