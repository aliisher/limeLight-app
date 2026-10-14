import React, { useCallback, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';
import Btn from '../../Components/Btn';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import ProfileChangePasswordCard from '../../Components/ProfileChangePasswordCard';
import ProfileInformationCard from '../../Components/ProfileInformationCard';
import ProfileSummaryCard from '../../Components/ProfileSummaryCard';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import {
  getProfileInfo,
  mapProfileData,
  normalizeAuthUser,
} from '../../Constants/roleConfig';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import { useRole } from '../../Context/RoleContext';
import { USER_DATA } from '../../Redux/Slices/AuthSlice';
import Api, { getAuthToken } from '../../Services/Api_services';
import {
  getAvatarDisplayUri,
  getProfileImagePath,
  getUserAvatarUri,
} from '../../Utils/profileImageHelpers';

const appendProfileImage = (formData, serverImagePath, avatarUri) => {
  const isLocalImage =
    avatarUri &&
    (avatarUri.startsWith('file:') || avatarUri.startsWith('content:'));

  if (isLocalImage) {
    formData.append('image', {
      uri: avatarUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });
    return;
  }

  if (serverImagePath) {
    formData.append('image', serverImagePath);
  }
};

const isLocalAvatarUri = uri =>
  Boolean(uri && (uri.startsWith('file:') || uri.startsWith('content:')));

const requestGalleryPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const hasPermission = await PermissionsAndroid.check(permission);

  if (hasPermission) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const Profile = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { role } = useRole();
  const userData = useSelector(state => state?.AUTH?.userData);

  console.log('userdata@@@',JSON.stringify(userData,null,2));
  
  const [profile, setProfile] = useState(
    () => userData || getProfileInfo(role),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedName, setSavedName] = useState(
    () => userData?.name || getProfileInfo(role).name,
  );
  const [serverImagePath, setServerImagePath] = useState(
    () => getProfileImagePath(userData) ?? null,
  );

  const applyProfileData = useCallback(
    data => {
      const profileData = mapProfileData(data, role);
      const nextServerImage = getProfileImagePath(data);

      setProfile({
        ...profileData,
        avatarUri: getAvatarDisplayUri(nextServerImage),
      });
      setSavedName(profileData.name);
      setServerImagePath(nextServerImage);
    },
    [role],
  );

  const handleChangeName = text => {
    setProfile(prev => ({ ...prev, name: text }));
  };

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleCancelName = () => {
    setProfile(prev => ({ ...prev, name: savedName }));
    setIsEditingName(false);
  };

  const handleUpdateProfile = async () => {
    const nextName = String(profile?.name ?? '').trim();

    if (!nextName) {
      Toast.show('Please enter full name', Toast.LONG);
      return;
    }

    if (nextName === savedName) {
      Toast.show('No changes to update', Toast.LONG);
      setIsEditingName(false);
      return;
    }

    if (!getAuthToken()) {
      Toast.show('Please login again', Toast.LONG);
      return;
    }

    if (!role) {
      Toast.show('Unable to determine user role', Toast.LONG);
      return;
    }

    setIsSavingName(true);

    const formData = new FormData();
    formData.append('name', nextName);
    formData.append('role', role);

    try {
      const res = await Api.updateProfile(formData);
      const resJson = res?.data;

      if (res?.status == 200) {
        const data = resJson?.data;

        if (data) {
          applyProfileData(data);
          const profileData = mapProfileData(data, role);
          dispatch(
            USER_DATA({
              ...normalizeAuthUser(userData),
              ...profileData,
              avatarUri: getProfileImagePath(data),
              name: profileData.name,
            }),
          );
        } else {
          setProfile(prev => ({ ...prev, name: nextName }));
          setSavedName(nextName);
          dispatch(
            USER_DATA({
              ...normalizeAuthUser(userData),
              ...profile,
              name: nextName,
            }),
          );
        }

        setIsEditingName(false);
        Toast.show(resJson?.message || 'Profile updated', Toast.LONG);
      } else {
        Toast.show(resJson?.message || 'Unable to update profile', Toast.LONG);
      }
    } catch (error) {
      Toast.show(
        error?.response?.data?.message || 'Unable to update profile',
        Toast.LONG,
      );
      console.log('update profile error',JSON.stringify(error,null,2));
      
    } finally {
      setIsSavingName(false);
    }
  };

  const hasPendingImageChange = isLocalAvatarUri(profile?.avatarUri);

  const handleUpdateProfileImage = async () => {
    const nextName = String(savedName ?? profile?.name ?? '').trim();

    if (!nextName) {
      Toast.show('Please enter full name', Toast.LONG);
      return;
    }

    if (!hasPendingImageChange) {
      return;
    }

    if (!getAuthToken()) {
      Toast.show('Please login again', Toast.LONG);
      return;
    }

    if (!role) {
      Toast.show('Unable to determine user role', Toast.LONG);
      return;
    }

    setIsUpdatingProfile(true);

    const formData = new FormData();
    formData.append('name', nextName);
    formData.append('role', role);
    appendProfileImage(formData, serverImagePath, profile?.avatarUri);

    console.log('Formdata',JSON.stringify(formData,null,2));
    

    console.log('formdata',JSON.stringify(formData,null,2));
    

    try {
      const res = await Api.updateProfile(formData);
      const resJson = res?.data;

      if (res?.status == 200) {
        const data = resJson?.data;

        console.log('profile update respoinse',JSON.stringify(data,null,2));
        

        if (data) {
          applyProfileData(data);
          const profileData = mapProfileData(data, role);
          dispatch(
            USER_DATA({
              ...normalizeAuthUser(userData),
              ...profileData,
              avatarUri: getProfileImagePath(data),
              name: profileData.name,
            }),
          );
        } else {
          dispatch(
            USER_DATA({
              ...normalizeAuthUser(userData),
              ...profile,
              name: nextName,
              avatarUri: profile?.avatarUri,
            }),
          );
        }

        Toast.show(resJson?.message || 'Profile updated', Toast.LONG);
      } else {
        Toast.show(resJson?.message || 'Unable to update profile', Toast.LONG);
      console.log('profile update error### ');

      }
    } catch (error) {
      Toast.show(
        error?.response?.data?.message || 'Unable to update profile',
        Toast.LONG,
      );
      console.log('profile update error ',JSON.stringify(error?.response?.data?.message,null,2));
      
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const getProfileData = async () => {
        setIsLoading(true);

        try {
          const res = await Api.getProfile();
          if (!isActive) {
            return;
          }

          const resJson = res?.data;

          if (res?.status == 200) {
            const data = resJson?.data || {};
            applyProfileData(data);

            const profileData = mapProfileData(data, role);
            dispatch(
              USER_DATA({
                ...normalizeAuthUser(userData),
                ...profileData,
                avatarUri: getProfileImagePath(data),
              }),
            );
          } else {
            Toast.show(res?.data?.message, Toast.LONG);
            setProfile(getProfileInfo(role));
          }
        } catch (error) {
          if (!isActive) {
            return;
          }
          Toast.show(error?.response?.data?.message, Toast.LONG);
          setProfile(prev => prev || getProfileInfo(role));
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      getProfileData();

      return () => {
        isActive = false;
      };
    }, [role, dispatch, applyProfileData]),
  );

  const handlePickImage = async () => {
    const hasPermission = await requestGalleryPermission();

    if (!hasPermission) {
      Toast.show(
        'Gallery permission is required to select a photo',
        Toast.LONG,
      );
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        includeBase64: false,
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Toast.show(
            response.errorMessage || 'Unable to pick image',
            Toast.LONG,
          );
          return;
        }

        const asset = response.assets?.[0];

        if (asset?.uri) {
          setProfile(prev => ({ ...prev, avatarUri: asset.uri }));
        }
      },
    );
  };

  const profileAvatarUri = isLocalAvatarUri(profile?.avatarUri)
    ? profile.avatarUri
    : getUserAvatarUri(userData) || profile?.avatarUri;

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.headerWrap}>
        <MainHeaderComponent
          title={Strings.profileHeader}
          showNotification
        />
      </View>

      {isLoading ? (
        <ScreenLoader />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: hp(4) + insets.bottom },
          ]}
        >
          <ProfileSummaryCard
            name={profile.name}
            roleTag={profile.roleTag}
            avatarUri={profileAvatarUri}
            onAvatarPress={handlePickImage}
          />
          <ProfileInformationCard
            branchLabel={profile.branchLabel}
            name={profile.name}
            branchValue={profile.branchValue}
            roleValue={profile.roleValue}
            designation={profile.designation}
            isEditingName={isEditingName}
            isSavingName={isSavingName}
            onChangeName={handleChangeName}
            onPressEditName={handleEditName}
            onPressSaveName={handleUpdateProfile}
            onPressCancelName={handleCancelName}
          />
          {hasPendingImageChange ? (
            <Btn
              title={Strings.updateProfile}
              onPress={handleUpdateProfileImage}
              loading={isUpdatingProfile}
              style={styles.updateBtn}
            />
          ) : null}
          <ProfileChangePasswordCard />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(4),
  },
  updateBtn: {
    marginBottom: hp(2.2),
  },
});

export default Profile;
