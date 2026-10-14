import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { Images } from '../../Assets';
import Btn from '../../Components/Btn';
import Customtextinput from '../../Components/Customtextinput';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenScrollView from '../../Components/ScreenScrollView';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import {
  digitRegex,
  lowercase,
  specialCharRegex,
  uppercase,
} from '../../Constants/Regex';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import Api, { getAuthToken } from '../../Services/Api_services';

const ChangePassword = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({
    newPasswordError: '',
    confirmPasswordError: '',
  });

  const handleContinue = async () => {
    if (isLoading) {
      return;
    } else if (!form.newPassword) {
      setError({
        newPasswordError: 'Please enter new password',
        confirmPasswordError: '',
      });
    } else if (form.newPassword.length < 8) {
      setError({
        newPasswordError: 'Password must be at least 8 characters',
        confirmPasswordError: '',
      });
    } else if (!lowercase.test(form.newPassword)) {
      setError({
        newPasswordError: 'Password must contain at least one lowercase letter',
        confirmPasswordError: '',
      });
    } else if (!uppercase.test(form.newPassword)) {
      setError({
        newPasswordError: 'Password must contain at least one uppercase letter',
        confirmPasswordError: '',
      });
    } else if (!digitRegex.test(form.newPassword)) {
      setError({
        newPasswordError: 'Password must contain at least one number',
        confirmPasswordError: '',
      });
    } else if (!specialCharRegex.test(form.newPassword)) {
      setError({
        newPasswordError: 'Password must contain at least one special character',
        confirmPasswordError: '',
      });
    } else if (!form.confirmPassword) {
      setError({
        newPasswordError: '',
        confirmPasswordError: 'Please enter confirm password',
      });
    } else if (form.newPassword !== form.confirmPassword) {
      setError({
        newPasswordError: '',
        confirmPasswordError: 'Passwords do not match',
      });
    } else {
      setError({ newPasswordError: '', confirmPasswordError: '' });

      if (!getAuthToken()) {
        setError({
          newPasswordError: 'Please login again',
          confirmPasswordError: '',
        });
        return;
      }

      setIsLoading(true);

      const formData = new FormData();
      formData.append('new_password', form.newPassword);
      formData.append('confirm_password', form.confirmPassword);

      try {
        const res = await Api.changePassword(formData);
        const resJson = res?.data;

        console.log(
          'Change Password Backend Response:',
          JSON.stringify(resJson, null, 2),
        );

        if (res?.status == 200) {
          console.log(
            'Change Password Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(resJson?.message, Toast.LONG);
          navigation.goBack();
        } else {
          console.log(
            'Change Password Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          Toast.show(res?.data?.message, Toast.LONG);
          setError({
            newPasswordError: res?.data?.message,
            confirmPasswordError: '',
          });
        }
      } catch (error) {
        console.log(
          'Change Password API Error:',
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );
        Toast.show(error?.response?.data?.message, Toast.LONG);
        setError({
          newPasswordError: error?.response?.data?.message,
          confirmPasswordError: '',
        });
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
        <MainHeaderComponent title={Strings.changePasswordHeader} />

        <Text style={styles.heading} numberOfLines={1}>
          {Strings.changePasswordTitle}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {Strings.passwordRulesDesc}
        </Text>

        <Customtextinput
          placeholder={Strings.newPasswordPlaceholder}
          icon={Images.Password}
          iconBg={Colors.lightGreen}
          value={form.newPassword}
          onChangeText={text => {
            setForm({ ...form, newPassword: text });
            setError({ ...error, newPasswordError: '' });
          }}
          secureTextEntry
          error={error.newPasswordError}
          wrapperStyle={styles.inputGap}
        />

        <Customtextinput
          placeholder={Strings.confirmPasswordPlaceholder}
          icon={Images.Password}
          iconBg={Colors.lightGreen}
          value={form.confirmPassword}
          onChangeText={text => {
            setForm({ ...form, confirmPassword: text });
            setError({ ...error, confirmPasswordError: '' });
          }}
          secureTextEntry
          error={error.confirmPasswordError}
        />

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
    maxWidth: wp(80),
  },
  inputGap: {
    marginBottom: hp(2),
  },
  continueBtn: {
    marginTop: hp(0.5),
  },
});

export default ChangePassword;
