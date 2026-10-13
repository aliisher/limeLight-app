import React, { useCallback, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MainHeaderComponent from '../../Components/MainHeaderComponent';
import BranchTargetCard from '../../Components/BranchTargetCard';
import ScreenLoader from '../../Components/ScreenLoader';
import { MyStyling } from '../../Constants/Styling';
import { Colors } from '../../Constants/Colors';
import { Strings } from '../../Constants/Strings';
import { hp, wp } from '../../Assets/Responsive';
import Api from '../../Services/Api_services';
import {
  mapAsmBranchTargets,
} from '../../Utils/asmMappers';
import {
  showApiMessageToast,
} from '../../Utils/apiHelpers';

const BranchTargets = () => {
  const [branchesData, setBranchesData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAsmBranchTargets = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await Api.getAsmBranchTargets();
      const resJson = res?.data;

      console.log(
        'ASM Branch Targets Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        console.log(
          'ASM Branch Targets Response:',
          JSON.stringify(resJson, null, 2),
        );

        const appResponse = mapAsmBranchTargets(resJson?.data);
        setBranchesData(appResponse);
      } else {
        console.log(
          'ASM Branch Targets Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'ASM Branch Targets API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAsmBranchTargets();
    }, [fetchAsmBranchTargets]),
  );

  const handleToggle = branchId => {
    setExpandedId(prev => (prev === branchId ? null : branchId));
  };

  const renderItem = ({ item }) => (
    <BranchTargetCard
      branch={item}
      isExpanded={expandedId === item?.id}
      onPress={() => handleToggle(item?.id)}
    />
  );

  return (
    <SafeAreaView style={MyStyling.container2} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.content}>
        <MainHeaderComponent
          title={Strings.branchTargets}
          showNotification
        />

        {isLoading ? (
          <ScreenLoader />
        ) : (
        <FlatList
          data={branchesData}
          keyExtractor={item => String(item?.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
        )}
      </View>
    </SafeAreaView>
  );
};

export default BranchTargets;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    backgroundColor: Colors.white,
  },
  listContent: {
    paddingBottom: hp(4),
  },
});
