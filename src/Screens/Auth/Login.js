import React, { useCallback, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Images } from '../../Assets';
import Btn from '../../Components/Btn';
import Customtextinput from '../../Components/Customtextinput';
import ScreenScrollView from '../../Components/ScreenScrollView';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { isValidLogin } from '../../Constants/Regex';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { useRole } from '../../Context/RoleContext';
import { USER_DATA } from '../../Redux/Slices/AuthSlice';
import Api, { setAuthToken } from '../../Services/Api_services';
import { mapApiTypeToRole, normalizeAuthUser, getTrainingApiRole } from '../../Constants/roleConfig';
import { getApiMessage } from '../../Utils/apiHelpers';
import {
  navigateAfterLogin,
  resetToRoute,
} from '../../Navigations/navigationHelpers';
import { requestNotificationPermissionAndGetFcmToken } from '../../Utils/fcmHelpers';

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { role, setRole } = useRole();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fcmToken, setFcmToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({
    emailError: '',
    passwordError: '',
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const prepareFcm = async () => {
        const token = await requestNotificationPermissionAndGetFcmToken();

        if (cancelled) {
          return;
        }

        if (token) {
          setFcmToken(token);
        }

        if (!role) {
          resetToRoute(navigation, 'Role');
        } else {
          setError({ emailError: '', passwordError: '' });
        }
      };

      prepareFcm();

      return () => {
        cancelled = true;
      };
    }, [role, navigation]),
  );

  const handleLogin = async () => {
    if (isLoading) {
      return;
    } else if (!role) {
      const message = 'Please select your role first';
      setError({
        emailError: message,
        passwordError: '',
      });
      Toast.show(message, Toast.LONG);
    } else if (!form.email.trim()) {
      const message = 'Please enter email or employee ID';
      setError({
        emailError: message,
        passwordError: '',
      });
      Toast.show(message, Toast.LONG);
    } else if (!isValidLogin(form.email.trim())) {
      const message = 'Please enter a valid email or employee ID';
      setError({
        emailError: message,
        passwordError: '',
      });
      Toast.show(message, Toast.LONG);
    } else if (!form.password) {
      const message = 'Please enter password';
      setError({
        emailError: '',
        passwordError: message,
      });
      Toast.show(message, Toast.LONG);
    } else {
      setError({ emailError: '', passwordError: '' });
      setIsLoading(true);

      let resolvedFcmToken = fcmToken;

      if (!resolvedFcmToken) {
        resolvedFcmToken =
          (await requestNotificationPermissionAndGetFcmToken()) ?? '';
        if (resolvedFcmToken) {
          setFcmToken(resolvedFcmToken);
        }
      }

      const formData = new FormData();
      formData.append('type', role);
      formData.append('login', form.email.trim());
      formData.append('password', form.password);

      if (resolvedFcmToken) {
        formData.append('fcm_token', resolvedFcmToken);
      }

      try {
        const res = await Api.login(formData);
        const resJson = res?.data ?? {};

        console.log(
          'Login Backend Response:',
          JSON.stringify(resJson, null, 2),
        );

        if (res?.status == 200) {
          console.log('Login Response:', JSON.stringify(resJson, null, 2));

          const token = resJson?.data?.token ?? resJson?.token;
          const isSuccess =
            resJson?.status !== 'error' &&
            Boolean(token ?? resJson?.data);

          if (isSuccess) {
            const user = normalizeAuthUser(resJson?.data);
            const apiRole = mapApiTypeToRole(user?.type) ?? role;
            const userWithType = {
              ...user,
              type: user?.type ?? getTrainingApiRole(apiRole),
              token: token ?? user?.token,
              login: user?.login ?? form.email.trim(),
              code: user?.code ?? user?.employee_id ?? form.email.trim(),
              employee_id:
                user?.employee_id ?? user?.code ?? form.email.trim(),
            };

            Toast.show(resJson?.message ?? 'Login successful', Toast.LONG);
            setAuthToken(token);
            dispatch(USER_DATA(userWithType));

            if (apiRole !== role) {
              console.log('Login role synced from API:', {
                selectedRole: role,
                apiRole,
                userType: userWithType?.type,
              });
            }
            setRole(apiRole);

            navigateAfterLogin(navigation);
          } else {
            Toast.show(getApiMessage(res) ?? resJson?.message, Toast.LONG);
          }
        } else {
          console.log(
            'Login Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(getApiMessage(res) ?? resJson?.message, Toast.LONG);
        }
      } catch (error) {
        console.log(
          'Login API Error:',
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );

        const message =
          getApiMessage(null, error) ??
          (error?.code === 'ECONNABORTED'
            ? 'Request timeout. Server respond nahi kar raha.'
            : !error?.response
              ? 'Server tak connection nahi ho raha. Internet ya backend check karein.'
              : null);

        if (message) {
          Toast.show(message, Toast.LONG);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <ScreenScrollView
      style={MyStyling.container1}
      contentContainerStyle={styles.content}
      backgroundColor={Colors.mint}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mint} />

      <Text style={styles.welcomeText} numberOfLines={1}>
        {Strings.welcomeBack}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {Strings.loginSubtitle}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {Strings.login}
        </Text>

        <Customtextinput
          label={Strings.emailLabel}
          placeholder={Strings.emailPlaceholder}
          icon={Images.Email}
          iconBg={Colors.lightBlue}
          value={form.email}
          onChangeText={text => {
            setForm({ ...form, email: text });
            setError({ ...error, emailError: '' });
          }}
          keyboardType="default"
          error={error.emailError}
        />

        <Customtextinput
          label={Strings.passwordLabel}
          placeholder={Strings.passwordPlaceholder}
          icon={Images.Password}
          iconBg={Colors.lightGreen}
          value={form.password}
          onChangeText={text => {
            setForm({ ...form, password: text });
            setError({ ...error, passwordError: '' });
          }}
          secureTextEntry
          showToggle
          error={error.passwordError}
        />

        <Pressable
          style={styles.forgotWrap}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText} numberOfLines={1}>
            {Strings.forgotPassword}
          </Text>
        </Pressable>
      </View>

      <Btn
        title={Strings.login}
        onPress={handleLogin}
        loading={isLoading}
      />
    </ScreenScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
    paddingBottom: hp(6),
  },
  welcomeText: {
    fontSize: Fontsize.ml,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
    marginTop: wp(10),
  },
  subtitle: {
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.grey,
    marginBottom: hp(3),
    lineHeight: hp(2),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: wp(8),
    paddingHorizontal: wp(5),
    paddingTop: hp(2.5),
    paddingBottom: hp(2.2),
    elevation: wp(0.2),
    borderColor: Colors.dividerBlue,
    borderWidth: wp(0.3),
  },
  cardTitle: {
    fontSize: Fontsize.m,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
    marginBottom: hp(2),
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: hp(0.5),
  },
  forgotText: {
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsBold,
    color: Colors.blue,
    maxWidth: wp(28),
  },
});

export default Login;
