import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import StaffDetailResourceCard from '../../Components/StaffDetailResourceCard';
import StaffDetailCategoryCard from '../../Components/StaffDetailCategoryCard';
import { MyStyling } from '../../Constants/Styling';
import { useRole } from '../../Context/RoleContext';
import Api from '../../Services/Api_services';
import {
  showApiMessageToast,
} from '../../Utils/apiHelpers';
import {
  resolveStaffId,
  getValidStaffId,
  getStaffDetailsEndpoint,
} from '../../Utils/staffHelpers';
import { mapStaffDetails } from '../../Utils/staffMappers';

const StaffDetail = ({ route }) => {
  const insets = useSafeAreaInsets();
  const { role } = useRole();
  const userData = useSelector(state => state.AUTH?.userData);
  const staffId = resolveStaffId(route?.params, userData, role);
  const validStaffId = getValidStaffId({ staff_id: staffId });
  const [profile, setProfile] = useState(null);
  const [garmentsCard, setGarmentsCard] = useState(null);
  const [unstitchedCard, setUnstitchedCard] = useState(null);
  const [accessoriesCard, setAccessoriesCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStaffDetails = useCallback(async () => {
    const endpoint = validStaffId
      ? getStaffDetailsEndpoint(validStaffId, role)
      : null;

    console.log(
      'Staff Details Screen Open:',
      JSON.stringify(
        {
          validStaffId,
          staffId,
          role,
          userType: userData?.type,
          endpoint,
          routeParams: route?.params,
        },
        null,
        2,
      ),
    );

    if (!validStaffId || !endpoint) {
      console.log(
        'Staff Details API skipped:',
        JSON.stringify(
          {
            reason: 'Missing staff id',
            hint: 'Branch Comparison se staff row tap karo, phir Staff Details kholo',
          },
          null,
          2,
        ),
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await Api.getStaffDetails(validStaffId, role);
      const resJson = res?.data;

      console.log(
        'Staff Details Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'Staff Details Response:',
          JSON.stringify(resJson, null, 2),
        );

        const appResponse = mapStaffDetails(resJson?.data);
        setProfile(appResponse.profile);
        setGarmentsCard(appResponse.garmentsCard);
        setUnstitchedCard(appResponse.unstitchedCard);
        setAccessoriesCard(appResponse.accessoriesCard);
      } else {
        console.log(
          'Staff Details Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'Staff Details API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    } finally {
      setIsLoading(false);
    }
  }, [role, route?.params, staffId, userData?.type, validStaffId]);

  useFocusEffect(
    useCallback(() => {
      fetchStaffDetails();
    }, [fetchStaffDetails]),
  );

  return (
    <View style={[MyStyling.container2, styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.headerWrap}>
        <MainHeaderComponent
          title={Strings.staffDetailsHeader}
          showNotification
        />
      </View>

      {!validStaffId ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{Strings.staffDetailSelectStaff}</Text>
        </View>
      ) : isLoading ? (
        <ScreenLoader />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: hp(3) + insets.bottom },
          ]}>
          <StaffDetailResourceCard profile={profile} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              {Strings.categoryPerformance}
            </Text>
          </View>

          {garmentsCard ? <StaffDetailCategoryCard item={garmentsCard} /> : null}
          {unstitchedCard ? (
            <StaffDetailCategoryCard item={unstitchedCard} />
          ) : null}
          {accessoriesCard ? (
            <StaffDetailCategoryCard item={accessoriesCard} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: wp(4),
    paddingBottom: hp(3),
  },
  headerWrap: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  emptyStateText: {
    fontSize: Fontsize.sm,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    textAlign: 'center',
    lineHeight: Fontsize.sm * 1.5,
  },
  sectionHeader: {
    marginTop: hp(1.5),
    marginBottom: hp(1.5),
  },
  sectionTitle: {
    fontSize: Fontsize.m,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.darkNavy,
    marginTop: wp(1),
    marginLeft: wp(2),
  },
});

export default StaffDetail;
