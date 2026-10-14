import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import * as Progress from 'react-native-progress';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { hp, wp } from '../Assets/Responsive';
import { Colors } from '../Constants/Colors';
import { Fonts } from '../Constants/Fonts';
import { Fontsize } from '../Constants/Fontsize';
import { getVideoSource } from '../Utils/trainingMappers';
import TrainingThumbnail from './TrainingThumbnail';

const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const DisplayAudioPlayer = ({ audioUrl, apiDuration, onAudioPlay }) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const source = getVideoSource(audioUrl);

  useEffect(() => {
    setIsPlaying(false);
    setDuration(0);
    setPosition(0);
  }, [audioUrl]);

  if (!audioUrl) {
    return null;
  }

  const progress = duration > 0 ? position / duration : 0;
  const timeLabel =
    duration > 0
      ? `${formatTime(position)} / ${formatTime(duration)}`
      : apiDuration || '0:00';

  return (
    <View style={styles.displayAudioBox}>
      {source ? (
        <Video
          ref={playerRef}
          source={source}
          paused={!isPlaying}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          progressUpdateInterval={250}
          onLoad={data => setDuration(data?.duration ?? 0)}
          onProgress={data => setPosition(data?.currentTime ?? 0)}
          onEnd={() => {
            setIsPlaying(false);
            setPosition(0);
            playerRef.current?.seek(0);
          }}
          onError={error => {
            console.log('Display training audio error:', audioUrl, error);
            setIsPlaying(false);
          }}
          style={styles.hiddenPlayer}
        />
      ) : null}

      <View style={styles.displayAudioRow}>
        <TouchableOpacity
          style={styles.displayPlayBtn}
          activeOpacity={0.9}
          onPress={() => {
            if (source) {
              if (!isPlaying) {
                onAudioPlay?.();
              }
              setIsPlaying(current => !current);
            }
          }}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={wp(4)}
            color={Colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.displayAudioLabel}>Audio Guide</Text>
        <Text style={styles.displayAudioTime}>{timeLabel}</Text>
      </View>
      <Progress.Bar
        progress={progress}
        width={null}
        height={hp(0.7)}
        color={Colors.amber}
        unfilledColor={Colors.platinum}
        borderWidth={0}
        borderRadius={wp(2)}
        style={styles.displayProgress}
      />
    </View>
  );
};

const TrainingDisplayCard = ({ item, onAudioPlay }) => {
  const hasLocation = Boolean(item?.location);
  const hasCategory = Boolean(item?.category);
  const hasDescription = Boolean(item?.description);
  const hasAudio = Boolean(item?.audioUrl);

  return (
    <View style={styles.displayCard}>
      <View style={styles.displayImageWrap}>
        <TrainingThumbnail
          thumbnail={item?.thumbnail}
          image={item?.image}
          imageUrl={item?.imageUrl}
          imageUrls={item?.imageUrls}
          style={styles.displayImage}
          resizeMode="cover"
        />
        {hasLocation ? (
          <View style={styles.locationPill}>
            <Feather name="map-pin" size={wp(3)} color={Colors.white} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.displayBody}>
        {hasCategory ? (
          <Text style={styles.displayCategory}>{item.category}</Text>
        ) : null}
        <Text style={styles.displayTitle}>{item.title}</Text>
        {hasDescription ? (
          <Text style={styles.displayDesc}>{item.description}</Text>
        ) : null}
        {hasAudio ? (
          <DisplayAudioPlayer
            audioUrl={item.audioUrl}
            apiDuration={item.duration}
            onAudioPlay={() => onAudioPlay?.(item)}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenPlayer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
  displayCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: Colors.softDivider,
    marginBottom: hp(2),
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  displayImageWrap: {
    width: '100%',
    height: hp(18),
    backgroundColor: Colors.darkSlate,
    justifyContent: 'flex-end',
  },
  displayImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: wp(4),
    margin: wp(3),
    gap: wp(1),
  },
  locationText: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xm2,
    color: Colors.white,
  },
  displayBody: {
    padding: wp(3.5),
  },
  displayCategory: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.xm2,
    color: Colors.green,
    letterSpacing: 0.5,
    marginBottom: hp(0.6),
  },
  displayTitle: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.sm1,
    color: Colors.black,
    marginBottom: hp(0.6),
  },
  displayDesc: {
    fontFamily: Fonts.poppinsRegular,
    fontSize: Fontsize.xs2,
    color: Colors.grey,
    lineHeight: hp(2.4),
    marginBottom: hp(1.6),
  },
  displayAudioBox: {
    backgroundColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },
  displayAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  displayPlayBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: wp(0.6),
    marginRight: wp(3),
  },
  displayAudioLabel: {
    flex: 1,
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xs2,
    color: Colors.charcoalText,
  },
  displayAudioTime: {
    fontFamily: Fonts.poppinsRegular,
    fontSize: Fontsize.xs1,
    color: Colors.grey,
  },
  displayProgress: {
    width: '100%',
  },
});

export default TrainingDisplayCard;
