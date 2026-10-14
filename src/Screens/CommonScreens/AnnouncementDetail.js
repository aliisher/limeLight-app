import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MainHeaderComponent from '../../Components/MainHeaderComponent';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { Strings } from '../../Constants/Strings';
import { MyStyling } from '../../Constants/Styling';

const AnnouncementDetail = props => {
  const insets = useSafeAreaInsets();
  const item = props?.route?.params?.item;

  return (
    <View style={MyStyling.container2}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: hp(4) + insets.bottom },
        ]}
      >
        <MainHeaderComponent title={Strings.announcementHeader} />

        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {item?.category}
              </Text>
            </View>

            {item?.date ? (
              <View style={styles.dateRow}>
                <Icon name="calendar" size={wp(3.5)} color={Colors.mediumGrey} />
                <Text style={styles.dateText} numberOfLines={1}>
                  {item.date}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {item?.title}
          </Text>
          <Text style={styles.description}>{item?.description}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  categoryBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(4),
  },
  categoryText: {
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
    marginLeft: wp(1),
  },
  title: {
    fontSize: Fontsize.l,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
    marginBottom: hp(1),
  },
  description: {
    fontSize: Fontsize.xs2,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.zinc,
    lineHeight: hp(2.5),
  },
});

export default AnnouncementDetail;
