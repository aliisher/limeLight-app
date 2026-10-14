import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { hp, wp } from '../Assets/Responsive';
import { Images } from '../Assets';
import { Colors } from '../Constants/Colors';
import { Fonts } from '../Constants/Fonts';
import { Fontsize } from '../Constants/Fontsize';
import TrainingAudioPlayer from './TrainingAudioPlayer';
import TrainingThumbnail from './TrainingThumbnail';

const ModalProductVisual = ({ product }) => {
  const image = product?.image ?? product?.detail?.image ?? null;
  const imageUrl = product?.imageUrl || product?.detail?.imageUrl || '';
  const imageUrls = product?.imageUrls?.length
    ? product.imageUrls
    : product?.detail?.imageUrls ?? [];
  const colorName = product?.detail?.color || product?.color || '';
  const hasImage = Boolean(imageUrl || imageUrls.length || image?.uri || typeof image === 'number');

  return (
    <View style={styles.modalSwatch}>
      <TrainingThumbnail
        key={`modal-thumb-${product?.id ?? imageUrl}`}
        thumbnail={image}
        image={image}
        imageUrl={imageUrl}
        imageUrls={imageUrls}
        style={styles.modalImageFill}
        resizeMode="cover"
      />

      {colorName && !hasImage ? (
        <View style={styles.colorBadge}>
          <MaterialCommunityIcons
            name="map-marker"
            size={wp(3.2)}
            color={Colors.white}
          />
          <Text style={styles.colorBadgeText} numberOfLines={1}>
            {colorName}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const TrainingDetailModal = ({ visible, product, onClose, onMarkCompleted }) => {
  const insets = useSafeAreaInsets();
  if (!product) {
    return null;
  }

  const detail = product.detail || {};
  const hasPrice = Boolean(product?.price);
  const hasSpecs = Boolean(detail?.shirt || detail?.bottom);
  const hasHighlights = (detail?.highlights ?? []).length > 0;
  const hasDescription = Boolean(detail?.description);
  const hasAudio = Boolean(detail?.audioUrl ?? product?.audioUrl);
  const audioUrl = detail?.audioUrl ?? product?.audioUrl;
  const modalTags = detail?.detailTags ?? [];
  const isProductCompleted = /complete/i.test(
    String(product?.status ?? product?.raw?.status ?? ''),
  );

  const handleMarkCompleted = () => {
    if (onMarkCompleted) {
      onMarkCompleted(product);
      return;
    }
    onClose?.();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      backdropOpacity={0.45}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={[styles.modalCard, { paddingBottom: hp(3) + insets.bottom }]}>
        <View style={styles.modalHandle} />

        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <View style={styles.greenDot} />
            <Text style={styles.modalHeaderTitle}>PRODUCT TRAINING</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Feather name="x" size={wp(4.5)} color={Colors.grey} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalScroll}
        >
          <View style={styles.modalTopRow}>
            <ModalProductVisual product={product} />

            <View style={styles.modalProductInfo}>
              <Text style={styles.modalProductTitle}>{product.title}</Text>
              {hasPrice ? (
                <Text style={styles.modalPrice}>{product.price}</Text>
              ) : null}
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}># {product.code}</Text>
              </View>
              {modalTags.length ? (
                <View style={styles.modalTagWrap}>
                  {modalTags.map((tag, i) => (
                    <View
                      key={`${tag.label}-${i}`}
                      style={[
                        styles.modalTag,
                        tag.solid ? styles.modalTagSolid : styles.modalTagOutline,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalTagText,
                          tag.solid && styles.modalTagTextSolid,
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {hasSpecs ? (
            <View style={styles.specRow}>
              {detail.shirt ? (
                <View style={styles.specBox}>
                  <View style={styles.specLabelRow}>
                    <MaterialCommunityIcons
                      name="tshirt-crew-outline"
                      size={wp(3.8)}
                      color={Colors.branchGreen}
                    />
                    <Text style={styles.specLabel}>SHIRT</Text>
                  </View>
                  <Text style={styles.specValue}>
                    {String(detail.shirt).replace(/ · /g, ' - ')}
                  </Text>
                  {detail.fabric ? (
                    <Text style={styles.specFabric}>Fabric: {detail.fabric}</Text>
                  ) : null}
                </View>
              ) : null}

              {detail.bottom ? (
                <View style={styles.specBox}>
                  <View style={styles.specLabelRow}>
                    <MaterialCommunityIcons
                      name="content-cut"
                      size={wp(3.8)}
                      color={Colors.branchGreen}
                    />
                    <Text style={styles.specLabel}>BOTTOM</Text>
                  </View>
                  <Text style={styles.specValue}>
                    {String(detail.bottom).replace(/ · /g, ' - ')}
                  </Text>
                  {detail.fabric ? (
                    <Text style={styles.specFabric}>Fabric: {detail.fabric}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {hasHighlights ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <Image
                  source={Images.SvgMargin}
                  style={styles.sectionHeaderIcon}
                  resizeMode="contain"
                />
                <Text style={styles.sectionHeaderText}>Key Highlights</Text>
              </View>
              {detail.highlights.map((point, i) => (
                <View key={`${point}-${i}`} style={styles.highlightRow}>
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={wp(3)} color={Colors.white} />
                  </View>
                  <Text style={styles.highlightPoint}>{point}</Text>
                </View>
              ))}
            </>
          ) : hasDescription ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <Image
                  source={Images.SvgMargin}
                  style={styles.sectionHeaderIcon}
                  resizeMode="contain"
                />
                <Text style={styles.sectionHeaderText}>Description</Text>
              </View>
              <Text style={styles.highlightPoint}>{detail.description}</Text>
            </>
          ) : null}

          {hasAudio ? (
            <>
              <View style={styles.audioSectionHeader}>
                <View style={styles.audioHeaderLeft}>
                  <Feather
                    name="headphones"
                    size={wp(4.2)}
                    color={Colors.branchGreen}
                  />
                  <Text style={styles.sectionHeaderText}>Audio Training</Text>
                </View>
                <View style={styles.guideBadge}>
                  <Text style={styles.guideBadgeText}>Guide</Text>
                </View>
              </View>

              <TrainingAudioPlayer
                audioUrl={audioUrl}
                variant="modal"
                apiDuration={detail.audio || product?.audio || ''}
              />
            </>
          ) : null}
        </ScrollView>

        {!isProductCompleted ? (
          <TouchableOpacity
            style={styles.completeBtn}
            activeOpacity={0.9}
            onPress={handleMarkCompleted}
          >
            <Text style={styles.completeBtnText}>Mark as Completed</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: hp(3),
    maxHeight: hp(88),
  },
  modalHandle: {
    width: wp(12),
    height: hp(0.6),
    borderRadius: wp(1),
    backgroundColor: Colors.platinum,
    alignSelf: 'center',
    marginBottom: hp(1.5),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  greenDot: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.branchGreen,
  },
  modalHeaderTitle: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.xs2,
    color: Colors.branchGreen,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: Colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingBottom: hp(1),
  },
  modalTopRow: {
    flexDirection: 'row',
    marginBottom: hp(2.2),
  },
  modalSwatch: {
    width: wp(28),
    height: wp(34),
    borderRadius: wp(3),
    marginRight: wp(4),
    backgroundColor: Colors.inputGrey,
    overflow: 'hidden',
    position: 'relative',
  },
  modalImageFill: {
    width: '100%',
    height: '100%',
  },
  colorBadge: {
    position: 'absolute',
    left: wp(2),
    bottom: hp(0.8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17,17,17,0.72)',
    paddingHorizontal: wp(2.8),
    paddingVertical: hp(0.55),
    borderRadius: wp(5),
    gap: wp(1.2),
    zIndex: 2,
  },
  colorBadgeText: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xm2,
    color: Colors.white,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductTitle: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.m,
    color: Colors.black,
    marginBottom: hp(0.6),
  },
  modalPrice: {
    fontFamily: Fonts.poppinsBold,
    fontSize: Fontsize.mm,
    color: Colors.amber,
    marginBottom: hp(1),
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: wp(2),
    marginBottom: hp(1.2),
  },
  codeBadgeText: {
    fontFamily: Fonts.poppinsRegular,
    fontSize: Fontsize.xs1,
    color: Colors.grey,
  },
  modalTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  modalTag: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
  },
  modalTagSolid: {
    backgroundColor: Colors.branchGreenBg,
  },
  modalTagOutline: {
    borderWidth: 1,
    borderColor: Colors.platinum,
    backgroundColor: Colors.white,
  },
  modalTagText: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xm2,
    color: Colors.branchGreen,
  },
  modalTagTextSolid: {
    color: Colors.branchGreen,
  },
  specRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  specBox: {
    flex: 1,
    backgroundColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3.5),
  },
  specLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginBottom: hp(1),
  },
  specLabel: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xm2,
    color: Colors.grey,
    letterSpacing: 0.5,
  },
  specValue: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.sm,
    color: Colors.black,
    marginBottom: hp(0.4),
  },
  specFabric: {
    fontFamily: Fonts.poppinsRegular,
    fontSize: Fontsize.xs1,
    color: Colors.mediumGrey,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.5),
  },
  sectionHeaderIcon: {
    width: wp(4.6),
    height: wp(4.6),
  },
  sectionHeaderText: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.sm1,
    color: Colors.black,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    marginBottom: hp(1.4),
  },
  checkCircle: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: Colors.branchGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightPoint: {
    flex: 1,
    fontFamily: Fonts.poppinsRegular,
    fontSize: Fontsize.xs5,
    color: Colors.dimGray,
  },
  audioSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    marginBottom: hp(1.5),
  },
  audioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  guideBadge: {
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.branchGreenBg,
    borderRadius: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
  },
  guideBadgeText: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: Fontsize.xm2,
    color: Colors.branchGreen,
  },
  completeBtn: {
    backgroundColor: Colors.green,
    borderRadius: wp(3),
    paddingVertical: hp(1.9),
    alignItems: 'center',
    marginTop: hp(2),
  },
  completeBtnText: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: Fontsize.sm1,
    color: Colors.white,
  },
});

export default TrainingDetailModal;
