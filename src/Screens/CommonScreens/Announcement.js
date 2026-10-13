import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AnnouncementCard from '../../Components/AnnouncementCard';
import AnnouncementFilterBar from '../../Components/AnnouncementFilterBar';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import ScreenLoader from '../../Components/ScreenLoader';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';
import Api from '../../Services/Api_services';
import Config from '../../Services/Config';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import {
  getAnnouncementCategoryParam,
  mapAnnouncements,
} from '../../Utils/announcementMappers';

const Announcement = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [listData, setListData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnnouncements = useCallback(async filter => {
    const category = getAnnouncementCategoryParam(filter);
    const endpoint = category
      ? `announcements?category=${encodeURIComponent(category)}`
      : 'announcements';

    console.log('Announcements API Request:', {
      filter,
      category: category || 'all',
      url: `${Config.baseURL}${endpoint}`,
    });

    setIsLoading(true);

    try {
      const res = await Api.getAnnouncements(category);
      const resJson = res?.data ?? {};

      console.log(
        'Announcements Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (res?.status == 200) {
        const mapped = mapAnnouncements(resJson?.data ?? resJson);

        console.log('Announcements Mapped Response:', JSON.stringify(mapped, null, 2));
        console.log('Announcements Count:', mapped.length);

        setListData(mapped);
      } else {
        console.log(
          'Announcements Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
        setListData([]);
      }
    } catch (error) {
      console.log(
        'Announcements API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
      setListData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements(selectedFilter);
    }, [fetchAnnouncements, selectedFilter]),
  );

  const handleFilterChange = filter => {
    console.log('Announcements Filter Changed:', filter);
    setSelectedFilter(filter);
  };

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <FlatList
        data={listData}
        keyExtractor={item => item?.id}
        renderItem={({ item }) => (
          <AnnouncementCard
            item={item}
            onPress={() =>
              navigation.navigate('AnnouncementDetail', { item })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <MainHeaderComponent
              title={Strings.announcementHeader}
              showNotification
            />
            <AnnouncementFilterBar
              selectedFilter={selectedFilter}
              onSelectFilter={handleFilterChange}
            />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ScreenLoader />
          ) : (
            <Text style={styles.emptyText}>No announcements available</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Fontsize.s,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    marginTop: hp(4),
  },
});

export default Announcement;
