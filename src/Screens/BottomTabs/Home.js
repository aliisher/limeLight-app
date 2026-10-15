import React, { useCallback, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CategoryBreakdownCard from '../../Components/CategoryBreakdownCard';
import CommissionCard from '../../Components/CommissionCard';
import HomeHeaderComponent from '../../Components/HomeHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import SlipBoundIncentiveItem, {
  SlipBoundIncentiveHeader,
} from '../../Components/SlipBoundIncentive';
import TargetVsAchievementCard from '../../Components/TargetVsAchievementCard';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { categoryColorMap } from '../../Constants/CategoryColors';
import {
  accessoriesTarget,
  commissionData,
  garmentsTarget,
  slipBoundIncentiveData,
  unstitchedTarget,
} from '../../Constants/DummyData';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import Api, {
  getAuthToken,
  getSlipBoundIncentiveList,
  setAuthToken,
} from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import { resolveIncentiveSlab } from '../../Utils/incentiveSlab';

const defaultTargetData = [garmentsTarget, unstitchedTarget, accessoriesTarget];

const getCategoryBarColor = categoryName => {
  const key = categoryName?.toLowerCase?.();
  return categoryColorMap[key] || Colors.limeGreen;
};

const formatDashboardAmount = value => {
  if (value == null || value === '') {
    return '0';
  }

  const str = String(value);

  if (/[Kk]|Rs/i.test(str)) {
    return str;
  }

  const num = Number(value);

  if (!Number.isFinite(num)) {
    return str;
  }

  if (num >= 1000) {
    const formatted = num / 1000;
    return Number.isInteger(formatted)
      ? `${formatted}K`
      : `${formatted.toFixed(1)}K`;
  }

  return String(Math.round(num));
};

const mapTargetVsAchievement = items => {
  const mapped = (items ?? []).map((item, index) => ({
    id: item?.category ?? String(index + 1),
    categoryName: item?.category ?? '',
    achieved: item?.achieved_percentage ?? 0,
    remaining: item?.remaining_percentage ?? 0,
    barColor: getCategoryBarColor(item?.category),
    fillPaddingLeft: index === 0 || index === 2 ? 20 : undefined,
    fillPaddingRight: index === 0 || index === 2 ? 8 : undefined,
  }));

  return mapped.length ? mapped : defaultTargetData;
};

const mapCommission = data => {
  if (!data) {
    return commissionData;
  }

  return {
    target: formatDashboardAmount(data?.target),
    sale: formatDashboardAmount(data?.sale),
    commission: String(data?.commission ?? '').includes('Rs')
      ? data.commission
      : `Rs. ${formatDashboardAmount(data?.commission)}`,
    achieved: data?.achieved_percentage ?? 0,
    remaining: data?.remaining_percentage ?? 0,
  };
};

const formatSaleAmount = value => {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return String(value ?? 0);
  }

  if (num >= 1000) {
    const formatted = num / 1000;
    return Number.isInteger(formatted)
      ? `${formatted}K`
      : `${formatted.toFixed(1)}K`;
  }

  return String(Math.round(num));
};

const parseIncentiveDate = dateStr => {
  const parts = (dateStr ?? '').trim().split(' ');

  if (parts.length >= 3) {
    return {
      dateDay: `${parts[0]} ${parts[1]}`,
      dateYear: parts[2],
    };
  }

  return {
    dateDay: dateStr || '-',
    dateYear: '',
  };
};

const mapSlipBoundIncentive = items =>
  (items ?? []).map((item, index) => {
    const { dateDay, dateYear } = parseIncentiveDate(item?.date);

    return {
      id: String(item?.invoice_id ?? index + 1),
      dateDay,
      dateYear,
      slab: resolveIncentiveSlab(item?.slab, item?.net_sale),
      invoice: String(item?.invoice_id ?? ''),
      salesId: String(item?.sales_id ?? ''),
      netSale: formatSaleAmount(item?.net_sale),
      incentive: String(item?.incentive ?? 0),
    };
  });

const renderIncentiveItem = ({ item }) => (
  <SlipBoundIncentiveItem item={item} />
);

const StaffHomeContent = () => {
  const authToken = useSelector(state => state.AUTH.userData?.token);
  const [targetData, setTargetData] = useState([]);
  const [targetMessage, setTargetMessage] = useState('');
  const [commission, setCommission] = useState([]);
  const [incentiveData, setIncentiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const ensureAuthToken = useCallback(() => {
    if (authToken && !getAuthToken()) {
      setAuthToken(authToken);
    }
  }, [authToken]);

  const fetchDashboard = useCallback(async () => {
    ensureAuthToken();

    try {
      const res = await Api.getDashboard();
      const resJson = res?.data;

      console.log(
        'Dashboard Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log('Dashboard Response:', JSON.stringify(resJson, null, 2));

        const dashboard = resJson?.data ?? {};
        const message = String(resJson?.message ?? '').trim();
        const isNoTarget = /no\s+target/i.test(message);
        const targetMapped = isNoTarget
          ? []
          : mapTargetVsAchievement(dashboard.target_vs_achievement);
        const commissionMapped = mapCommission(dashboard.commission);

        setTargetMessage(isNoTarget ? message : '');
        setTargetData(targetMapped);
        setCommission(commissionMapped);
      } else {
        console.log(
          'Dashboard Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'Dashboard API Error:',
        JSON.stringify(
          error?.response?.data ?? error?.message ?? error,
          null,
          2,
        ),
      );
    }
  }, [ensureAuthToken]);

  const fetchSlipBoundIncentive = useCallback(async () => {
    if (!authToken) {
      console.log('[Slip Bound Incentive] Skipped: auth token missing');
      return;
    }

    ensureAuthToken();

    try {
      const res = await Api.getSlipBoundIncentive();
      const resJson = res?.data ?? {};

      console.log(
        'Slip Bound Incentive Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'Slip Bound Incentive Response:',
          JSON.stringify(resJson, null, 2),
        );

        const incentiveItems = getSlipBoundIncentiveList(resJson);
        const appResponse = mapSlipBoundIncentive(incentiveItems);

        setIncentiveData(appResponse);
      } else {
        console.log(
          'Slip Bound Incentive Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'Slip Bound Incentive API Error:',
        JSON.stringify(
          error?.response?.data ?? error?.message ?? error,
          null,
          2,
        ),
      );
    }
  }, [authToken, ensureAuthToken]);

  useFocusEffect(
    useCallback(() => {
      if (!authToken) {
        return;
      }

      let isActive = true;

      const loadHomeData = async () => {
        setIsLoading(true);

        try {
          await Promise.all([fetchDashboard(), fetchSlipBoundIncentive()]);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadHomeData();

      return () => {
        isActive = false;
      };
    }, [authToken, fetchDashboard, fetchSlipBoundIncentive]),
  );

  if (isLoading) {
    return <ScreenLoader style={styles.loader} />;
  }

  return (
    <FlatList
      data={incentiveData}
      keyExtractor={item => item?.id}
      renderItem={renderIncentiveItem}
      ListHeaderComponent={
        <View>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {Strings.myPerformance}
          </Text>
          <TargetVsAchievementCard
            items={targetData}
            emptyMessage={targetMessage}
          />
          <CommissionCard data={commission} />
          <CategoryBreakdownCard />

          <Text style={styles.sectionTitle} numberOfLines={1}>
            {Strings.slipBoundIncentive}
          </Text>
          <Text style={styles.sectionSub} numberOfLines={2}>
            {Strings.slipBoundIncentiveSub}
          </Text>
          <SlipBoundIncentiveHeader />
        </View>
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
};

const Home = () => {
  const userData = useSelector(state => state?.AUTH?.userData);

  const userName =
    userData?.name || userData?.user?.name || userData?.data?.name || '';

  return (
    <View style={MyStyling.container2}>
      <View style={styles.headerArea}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkNavy} />

        <HomeHeaderComponent userName={userName} />
      </View>

      <StaffHomeContent />
    </View>
  );
};
const styles = StyleSheet.create({
  headerArea: {
    backgroundColor: Colors.darkNavy,
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2.3),
    paddingBottom: hp(3),
  },
  pageTitle: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.mm,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: hp(2.1),
  },
  sectionTitle: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.slipBoundSectionTitle,
    color: Colors.black,
  },
  sectionSub: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.xs1,
    color: Colors.steelGray,
    marginTop: hp(0.4),
    marginBottom: hp(1.2),
  },
  loader: {
    flex: 1,
  },
});

export default Home;
