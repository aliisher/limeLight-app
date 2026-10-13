import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Images } from '../Assets';
import { hp, wp } from '../Assets/Responsive';
import { Colors } from '../Constants/Colors';
import { Fontsize } from '../Constants/Fontsize';
import { Fonts } from '../Constants/Fonts';

const NotificationCard = ({ item, onPress }) => {
  const iconKey = item?.icon === 'Survey' ? 'Note' : item?.icon;
  const iconSource = Images[iconKey];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.iconBox}>
        {iconSource ? (
          <Image
            source={iconSource}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : (
          <Icon name={item?.icon} size={wp(5)} color={Colors.mediumGrey} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item?.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item?.description}
        </Text>
        <View style={styles.footerRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {item?.category}
            </Text>
          </View>
          <Text style={styles.time} numberOfLines={1}>
            {item?.time}
          </Text>
        </View>
      </View>

      <Image
        source={Images.RightArrow}
        style={styles.chevron}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.6),
    marginBottom: hp(1.2),
    elevation: 1,
  },
  iconBox: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGrey,
    flexShrink: 0,
    marginTop: hp(0.2),
  },
  iconImage: {
    width: wp(5.2),
    height: wp(5.2),
    tintColor: Colors.mediumGrey,
  },
  content: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: wp(2.5),
    marginRight: wp(1.5),
  },
  title: {
    fontSize: Fontsize.xs2,
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black,
    marginBottom: hp(0.3),
    lineHeight: Fontsize.xs2 * 1.3,
  },
  description: {
    fontSize: wp(3.1),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.zinc,
    lineHeight: wp(3.1) * 1.35,
    marginBottom: hp(0.7),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  tag: {
    flexShrink: 1,
    maxWidth: '100%',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.25),
    borderRadius: wp(3),
    backgroundColor: Colors.lightGrey,
  },
  tagText: {
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsMedium,
    color: Colors.mediumGrey,
  },
  time: {
    flexShrink: 1,
    fontSize: Fontsize.xs,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.mediumGrey,
  },
  chevron: {
    width: wp(2.5),
    height: wp(2.5),
    tintColor: Colors.mediumGrey,
    flexShrink: 0,
    marginTop: hp(0.6),
  },
});

export default NotificationCard;
