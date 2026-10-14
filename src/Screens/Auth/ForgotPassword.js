import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Images } from '../../Assets';
import Btn from '../../Components/Btn';
import Customtextinput from '../../Components/Customtextinput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenScrollView from '../../Components/ScreenScrollView';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { emailRegex } from '../../Constants/Regex';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import Api from '../../Services/Api_services';

const ForgotPassword = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const role = useSelector(state => state?.ROLE?.userData);
  const [form, setForm] = useState({ email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ emailError: '' });

  const handleSendVerificationCode = async () => {
    if (isLoading) {
      return;
    } else if (!role) {
      setError({ emailError: 'Please select your role first' });
    } else if (!form.email.trim()) {
      setError({ emailError: Strings.pleaseEnterEmail });
    } else if (!emailRegex.test(form.email.trim())) {
      setError({ emailError: Strings.pleaseEnterValidEmail });
    } else {
      setError({ emailError: '' });
      setIsLoading(true);

      const formData = new FormData();
      formData.append('type', role);
      formData.append('login', form.email.trim());

      try {
        const res = await Api.sendOtp(formData);
        const resJson = res?.data;

        console.log(
          'Send OTP Backend Response:',
          JSON.stringify(resJson, null, 2),
        );

        if (res?.status == 200) {
          console.log('Send OTP Response:', JSON.stringify(resJson, null, 2));
          Toast.show(resJson?.message, Toast.LONG);
          navigation.navigate('Verification', {
            login: form.email.trim(),
            type: role,
          });
        } else {
          console.log(
            'Send OTP Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(res?.data?.message, Toast.LONG);
          setError({
            emailError: res?.data?.message,
          });
        }
      } catch (error) {
        console.log(
          'Send OTP API Error:',
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );
        Toast.show(error?.response?.data?.message, Toast.LONG);
        setError({ emailError: error?.response?.data?.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScreenScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: hp(4) + insets.bottom },
        ]}>
        <MainHeaderComponent title={Strings.forgotPasswordHeader} />

        <Text style={styles.heading} numberOfLines={1}>{Strings.cannotLogin}</Text>
        <Text style={styles.description} numberOfLines={2}>{Strings.forgotPasswordDesc}</Text>

        <Customtextinput
          label={Strings.forgotPasswordEmailLabel}
          placeholder={Strings.forgotPasswordEmailPlaceholder}
          icon={Images.Email}
          iconBg={Colors.lightBlue}
          value={form.email}
          onChangeText={text => {
            setForm({ ...form, email: text });
            setError({ ...error, emailError: '' });
          }}
          keyboardType="email-address"
          error={error.emailError}
        />

        <Btn
          title={Strings.sendVerificationCode}
          onPress={handleSendVerificationCode}
          loading={isLoading}
          style={styles.sendBtn}
        />
      </ScreenScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  heading: {
    fontSize: Fontsize.l,

    fontFamily: Fonts.poppinsMedium,
    color: Colors.black,
  },
  description: {
    fontSize: Fontsize.xs2,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    lineHeight: hp(2.5),
    marginBottom: hp(1.5),
  },
  sendBtn: {
    marginTop: hp(0.5),
  },
});

export default ForgotPassword;
