import React, { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { Images } from '../../Assets';
import Btn from '../../Components/Btn';
import Customtextinput from '../../Components/Customtextinput';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import { mapProfileData, normalizeAuthUser, ROLES } from '../../Constants/roleConfig';
import { MyStyling } from '../../Constants/Styling';
import { useRole } from '../../Context/RoleContext';
import { USER_DATA } from '../../Redux/Slices/AuthSlice';
import { store } from '../../Redux/Store';
import {
  selectFeedbackProfile,
} from '../../Redux/selectors/authSelectors';
import Api, { getAuthToken } from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';

const FeedBack = () => {
  const dispatch = useDispatch();
  const { role } = useRole();
  const isAsm = role === ROLES.ASM;
  const locationLabel = isAsm ? Strings.region : Strings.branchLabel;

  const { code: userCode, name: userName, location: userLocation } =
    useSelector(state => selectFeedbackProfile(state, role));

  const [form, setForm] = useState({ feedback: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({
    feedbackError: '',
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        try {
          const res = await Api.getProfile();
          if (!isActive) {
            return;
          }

          const resJson = res?.data;
          console.log(
            'Feedback getProfile Backend Response:',
            JSON.stringify(resJson, null, 2),
          );

          if (res?.status == 200) {
            const data = resJson?.data || {};
            const profileData = mapProfileData(data, role);
            const normalized = normalizeAuthUser(store.getState()?.AUTH?.userData);

            console.log(
              'Feedback getProfile Response:',
              JSON.stringify(resJson, null, 2),
            );

            dispatch(
              USER_DATA({
                ...normalized,
                ...profileData,
                employee_id:
                  data?.employee_id ??
                  data?.code ??
                  normalized?.employee_id ??
                  normalized?.code ??
                  normalized?.login,
                code:
                  data?.code ??
                  data?.employee_id ??
                  normalized?.code ??
                  normalized?.employee_id ??
                  normalized?.login,
                login: normalized?.login ?? data?.login ?? data?.code,
                region_name:
                  data?.region_name ??
                  data?.region ??
                  normalized?.region_name,
                region:
                  data?.region ??
                  data?.region_name ??
                  normalized?.region,
              }),
            );
          } else {
            console.log(
              'Feedback getProfile Error Response:',
              JSON.stringify(resJson, null, 2),
            );
          }
        } catch (err) {
          if (!isActive) {
            return;
          }
          console.log(
            'Feedback getProfile API Error:',
            JSON.stringify(err?.response?.data ?? err?.message ?? err, null, 2),
          );
        }
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [role, dispatch]),
  );

  const handleSubmit = async () => {
    if (isLoading) {
      return;
    } else if (!form.feedback.trim()) {
      setError({
        feedbackError: 'Please enter feedback',
      });
    } else if (!getAuthToken()) {
      Toast.show('Please login again', Toast.LONG);
    } else {
      setError({
        feedbackError: '',
      });
      setIsLoading(true);

      const formData = new FormData();
      formData.append('code', userCode.trim());
      formData.append('name', userName.trim());
      formData.append(
        isAsm ? 'region_name' : 'branch_name',
        userLocation.trim(),
      );
      formData.append('feedback', form.feedback.trim());

      const feedbackLabel = isAsm ? 'ASM Feedback' : 'Staff Feedback';

      try {
        const res = isAsm
          ? await Api.asmFeedback(formData)
          : await Api.staffFeedback(formData);
        const resJson = res?.data ?? {};

        console.log(
          `${feedbackLabel} Backend Response:`,
          JSON.stringify(resJson, null, 2),
        );

        if (res?.status == 200) {
          console.log(
            `${feedbackLabel} Response:`,
            JSON.stringify(resJson, null, 2),
          );

          Toast.show(
            resJson?.message || 'Feedback submitted successfully',
            Toast.LONG,
          );
          setForm(prev => ({ ...prev, feedback: '' }));
        } else {
          console.log(
            `${feedbackLabel} Error Response:`,
            JSON.stringify(resJson, null, 2),
          );
          showApiMessageToast(res);
        }
      } catch (error) {
        console.log(
          `${feedbackLabel} API Error:`,
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MainHeaderComponent
          title={Strings.feedbackHeader}
          showNotification
        />

        <Text style={styles.heading} numberOfLines={1}>
          {Strings.shareYourFeedback}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {Strings.feedbackSubtitle}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Customtextinput
              feedbackStyle
              icon={Images.Hash}
              label={Strings.codeLabel}
              value={userCode}
              editable={false}
              wrapperStyle={styles.halfInput}
            />
            <Customtextinput
              feedbackStyle
              label={Strings.nameLabel}
              icon={Images.Person}
              value={userName}
              editable={false}
              wrapperStyle={styles.halfInput}
            />
          </View>

          <Customtextinput
            feedbackStyle
            label={locationLabel}
            icon={Images.Branch}
            value={userLocation}
            editable={false}
            iconTint={Colors.branchGreen}
            wrapperStyle={styles.inputSideSpace}
          />

          <Customtextinput
            feedbackStyle
            label={Strings.yourFeedbackLabel}
            labelRight={Strings.required}
            multiline
            value={form.feedback}
            onChangeText={text => {
              setForm(prev => ({ ...prev, feedback: text }));
              if (text.length > 0) {
                setError(prev => ({ ...prev, feedbackError: '' }));
              }
            }}
            error={error.feedbackError}
            wrapperStyle={[styles.inputSideSpace, styles.lastInput]}
          />

          <View style={[styles.noteRow, styles.inputSideSpace]}>
            <Image
              source={Images.Info}
              style={styles.infoIcon}
              resizeMode="contain"
            />
            <Text style={styles.noteText} numberOfLines={2}>
              {Strings.feedbackNote}
            </Text>
          </View>
        </View>

        <Btn
          title={Strings.submitFeedback}
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  heading: {
    fontSize: Fontsize.l,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
  },
  subtitle: {
    fontSize: Fontsize.xs1,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    marginBottom: hp(2),
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    elevation: 0.7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(2),
  },
  halfInput: {
    width: wp(33),
  },
  inputSideSpace: {
    paddingHorizontal: wp(2),
  },
  lastInput: {
    marginBottom: hp(1),
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: hp(0.5),
  },
  infoIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(2),
    marginTop: hp(0.2),
  },
  noteText: {
    flex: 1,
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    lineHeight: hp(2.2),
  },
  submitBtn: {
    marginTop: hp(2.5),
  },
});

export default FeedBack;
