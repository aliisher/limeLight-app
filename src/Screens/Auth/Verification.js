import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import Btn from '../../Components/Btn';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import OtpInput from '../../Components/OtpInput';
import ScreenScrollView from '../../Components/ScreenScrollView';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { otpRegex } from '../../Constants/Regex';
import { Strings } from '../../Constants/Strings';
import Api from '../../Services/Api_services';

const RESEND_TIMER_SECONDS = 50;

const Verification = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { login, type } = route.params || {};

  const [form, setForm] = useState({ otp: ['', '', '', '', '', ''] });
  const [error, setError] = useState({ otpError: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const isResendDisabled = resendTimer > 0;
  const resendText =
    resendTimer > 0
      ? Strings.resend + '(' + resendTimer + ')'
      : Strings.resend;

  useEffect(() => {
    if (!isResendDisabled) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isResendDisabled]);

  const handleResend = async () => {
    if (isResendDisabled) {
      return;
    } else if (!login || !type) {
      setError({ otpError: 'Please go back and enter your email or ID again' });
    } else {
      setError({ otpError: '' });

      const formData = new FormData();
      formData.append('type', type);
      formData.append('login', login);

      try {
        const res = await Api.resendOtp(formData);
        const resJson = res?.data;

        console.log(
          'Resend OTP Backend Response:',
          JSON.stringify(resJson, null, 2),
        );

        if (res?.status == 200) {
          console.log('Resend OTP Response:', JSON.stringify(resJson, null, 2));
          Toast.show(resJson?.message, Toast.LONG);
          setResendTimer(RESEND_TIMER_SECONDS);
        } else {
          console.log(
            'Resend OTP Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(res?.data?.message, Toast.LONG);
          setError({ otpError: res?.data?.message });
        }
      } catch (error) {
        console.log(
          'Resend OTP API Error:',
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );
        Toast.show(error?.response?.data?.message, Toast.LONG);
        setError({ otpError: error?.response?.data?.message });
      }
    }
  };

  const handleContinue = async () => {
    const otpValue = form.otp.join('');

    if (isLoading) {
      return;
    } else if (!login || !type) {
      setError({ otpError: 'Please go back and enter your email or ID again' });
    } else if (!otpValue) {
      setError({ otpError: 'Please enter OTP' });
    } else if (!otpRegex.test(otpValue)) {
      setError({ otpError: 'OTP must be 6 digits' });
    } else {
      setError({ otpError: '' });
      setIsLoading(true);

      const formData = new FormData();
      formData.append('type', type);
      formData.append('login', login);
      formData.append('otp', otpValue);

      try {
        const res = await Api.verifyOtp(formData);
        const resJson = res?.data;

        console.log(
          'Verify OTP Backend Response:',
          JSON.stringify(resJson, null, 2),
        );

        if (res?.status == 200) {
          console.log('Verify OTP Response:', JSON.stringify(resJson, null, 2));
          Toast.show(resJson?.message, Toast.LONG);
          navigation.navigate('ResetPassword', {
            login,
            type,
            otp: otpValue,
          });
        } else {
          console.log(
            'Verify OTP Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(res?.data?.message, Toast.LONG);
          setError({ otpError: res?.data?.message });
        }
      } catch (error) {
        console.log(
          'Verify OTP API Error:',
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );
        Toast.show(error?.response?.data?.message, Toast.LONG);
        setError({ otpError: error?.response?.data?.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: hp(4) + insets.bottom },
        ]}>
        <MainHeaderComponent title={Strings.verificationHeader} />

      <Text style={styles.heading} numberOfLines={1}>
        {Strings.enterOtp}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {login ? `OTP sent to ${login}` : Strings.otpSentTo}
      </Text>

      <OtpInput
        value={form.otp}
        onChange={otp => {
          setForm({ ...form, otp });
          setError({ ...error, otpError: '' });
        }}
        error={error.otpError}
      />

      <View style={styles.resendRow}>
        <Text style={styles.resendText} numberOfLines={2}>
          {Strings.didntReceiveCode}
          <Text
            style={[styles.resendLink, isResendDisabled && styles.resendLinkDisabled]}
            onPress={handleResend}
            disabled={isResendDisabled}
            numberOfLines={1}>
            {resendText}
          </Text>
        </Text>
      </View>

      <Btn
        title={Strings.continue}
        onPress={handleContinue}
        loading={isLoading}
        style={styles.continueBtn}
      />
      </ScreenScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  heading: {
    fontSize: Fontsize.l,
    fontFamily: Fonts.poppinsMedium,
    color: Colors.black,
  },
  subtitle: {
    fontSize: Fontsize.xs2,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.black,
    marginBottom: hp(1.7),
  },
  resendRow: {
    alignItems: 'flex-end',
    marginBottom: hp(1),
  },
  resendText: {
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
  },
  resendLink: {
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.teal,
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  continueBtn: {
    marginTop: hp(0.5),
  },
});

export default Verification;
