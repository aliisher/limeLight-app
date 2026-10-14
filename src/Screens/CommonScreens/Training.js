import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { hp, wp } from '../../Assets/Responsive';
import { Colors } from '../../Constants/Colors';
import { Fontsize } from '../../Constants/Fontsize';
import { Fonts } from '../../Constants/Fonts';
import { useRole } from '../../Context/RoleContext';
import Api, { isApiSuccess } from '../../Services/Api_services';
import { showApiMessageToast } from '../../Utils/apiHelpers';
import {
  isExternalVideoLink,
  mapDisplayCategoriesResponse,
  mapProductTraining,
  mapTrainingDisplay,
  mapTrainingVideos,
  toDisplayApiCategory,
} from '../../Utils/trainingMappers';
import { trainingDisplayCategories } from '../../Constants/DummyData';
import TrainingCustomerCard from '../../Components/TrainingCustomerCard';
import TrainingDetailModal from '../../Components/TrainingDetailModal';
import TrainingDisplayCard from '../../Components/TrainingDisplayCard';
import TrainingDisplayCategories from '../../Components/TrainingDisplayCategories';
import TrainingHeader from '../../Components/TrainingHeader';
import TrainingProductCard from '../../Components/TrainingProductCard';
import TrainingStatusChips from '../../Components/TrainingStatusChips';
import TrainingTabs from '../../Components/TrainingTabs';
import TrainingVideoModal from '../../Components/TrainingVideoModal';
import ScreenLoader from '../../Components/ScreenLoader';
import { useSelector } from 'react-redux';

const getTrainingVideoStatusParam = status => {
  const normalized = String(status ?? 'New').trim().toLowerCase();

  if (normalized === 'pending') {
    return 'pending';
  }

  if (normalized === 'completed' || normalized === 'complete') {
    return 'completed';
  }

  return 'new';
};

const resolveDisplayCategoryValue = (categoryLabel, categories = []) => {
  const matched = categories.find(item => item.label === categoryLabel);

  if (matched?.value) {
    return matched.value;
  }

  return toDisplayApiCategory(categoryLabel);
};

const Training = () => {
  const route = useRoute();
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState(route.params?.tab || 'Customer');
  const [activeStatus, setActiveStatus] = useState(
    route.params?.status || 'New',
  );
  const [activeCategory, setActiveCategory] = useState('Unstitched');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerData, setCustomerData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [displayCategories, setDisplayCategories] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const displayCategoriesRef = useRef([]);
  const displayCategoriesLoadedRef = useRef(false);
    const userData = useSelector(state => state?.AUTH?.userData);

  console.log('userdata@@@',JSON.stringify(userData,null,2));

  const updateTrainingItemStatus = useCallback(async (itemId, onSuccess) => {
    if (itemId == null || itemId === '') {
      return false;
    }

    const statusPayload = { status: 'complete' };

    console.log(
      'Training Video Status Request:',
      JSON.stringify(
        {
          videoId: itemId,
          ...statusPayload,
        },
        null,
        2,
      ),
    );

    try {
      const res = await Api.updateTrainingVideoStatus(itemId, statusPayload);
      const resJson = res?.data ?? {};

      console.log(
        'Training Video Status Backend Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (isApiSuccess(res)) {
        onSuccess?.();
        return true;
      }

      console.log(
        'Training Video Status Error Response:',
        JSON.stringify(resJson, null, 2),
      );
    } catch (error) {
      console.log(
        'Training Video Status API Error:',
        JSON.stringify(
          error?.response?.data ?? error?.message ?? error,
          null,
          2,
        ),
      );
    }

    return false;
  }, []);

  const displayCategoryLabels =
    displayCategories.length > 0
      ? displayCategories.map(item => item.label)
      : trainingDisplayCategories;

  const fetchDisplayCategories = useCallback(async () => {
    if (displayCategoriesLoadedRef.current) {
      return displayCategoriesRef.current;
    }

    try {
      console.log(
        'Display Categories Request:',
        JSON.stringify({ endpoint: 'GET /api/display-categories' }, null, 2),
      );

      const res = await Api.getDisplayCategories();
      const resJson = res?.data ?? {};

      console.log(
        'Display Categories Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (isApiSuccess(res)) {
        const mapped = mapDisplayCategoriesResponse(resJson);

        console.log(
          'Display Categories Mapped Response:',
          JSON.stringify(mapped, null, 2),
        );

        displayCategoriesLoadedRef.current = true;
        displayCategoriesRef.current = mapped;
        setDisplayCategories(mapped);

        return mapped;
      }

      console.log(
        'Display Categories Error Response:',
        JSON.stringify(resJson, null, 2),
      );
      showApiMessageToast(res);
    } catch (error) {
      console.log(
        'Display Categories API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    }

    return displayCategoriesRef.current;
  }, []);

  const fetchTrainingVideos = useCallback(async () => {
    if (activeTab !== 'Customer') {
      return;
    }

    const apiStatus = getTrainingVideoStatusParam(activeStatus);

    try {
      console.log(
        'Training Videos Request:',
        JSON.stringify({ status: apiStatus }, null, 2),
      );

      const res = await Api.getTrainingVideos(apiStatus);
      const resJson = res?.data ?? {};

      console.log(
        'Training Videos Response:',
        JSON.stringify(resJson, null, 2),
      );

      if (isApiSuccess(res)) {
        const mapped = mapTrainingVideos(resJson?.data ?? resJson);

        console.log(
          'Training Videos Mapped Response:',
          JSON.stringify(mapped, null, 2),
        );

        setCustomerData(mapped.customer);
      } else {
        console.log(
          'Training Videos Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'Training Videos API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    }
  }, [activeStatus, activeTab]);

  const fetchProductTraining = useCallback(async () => {
    if (activeTab !== 'Product') {
      return;
    }

    const apiStatus = getTrainingVideoStatusParam(activeStatus);

    try {
      console.log(
        'Product Training Request:',
        JSON.stringify({ status: apiStatus }, null, 2),
      );

      const res = await Api.getProductTraining(apiStatus);
      const resJson = res?.data ?? {};

      if (isApiSuccess(res)) {
        console.log(
          'Product Training Response:',
          JSON.stringify(resJson, null, 2),
        );

        setProductData(mapProductTraining(resJson));
      } else {
        console.log(
          'Product Training Error Response:',
          JSON.stringify(resJson, null, 2),
        );
        showApiMessageToast(res);
      }
    } catch (error) {
      console.log(
        'Product Training API Error:',
        JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
      );
    }
  }, [activeStatus, activeTab]);

  const fetchDisplayTraining = useCallback(
    async (categoryLabel, categories = displayCategoriesRef.current) => {
      if (activeTab !== 'Display') {
        return;
      }

      const apiCategory = resolveDisplayCategoryValue(categoryLabel, categories);
      const apiStatus = getTrainingVideoStatusParam(activeStatus);

      try {
        console.log(
          'Training Display Request:',
          JSON.stringify({ category: apiCategory, status: apiStatus }, null, 2),
        );

        const res = await Api.getTrainingDisplay(apiCategory, apiStatus);
        const resJson = res?.data ?? {};

        if (isApiSuccess(res)) {
          console.log(
            'Training Display Response:',
            JSON.stringify(resJson, null, 2),
          );

          setDisplayData(mapTrainingDisplay(resJson, categoryLabel));
        } else {
          console.log(
            'Training Display Error Response:',
            JSON.stringify(resJson, null, 2),
          );
          showApiMessageToast(res);
        }
      } catch (error) {
        console.log(
          'Training Display API Error:',
          JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2),
        );
      }
    },
    [activeStatus, activeTab],
  );

  const loadTrainingData = useCallback(async () => {
    if (!role) {
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'Customer') {
        await fetchTrainingVideos();
      }

      if (activeTab === 'Product') {
        await fetchProductTraining();
      }

      if (activeTab === 'Display') {
        const categories = await fetchDisplayCategories();

        if (
          categories.length &&
          !categories.some(item => item.label === activeCategory)
        ) {
          setActiveCategory(categories[0].label);
          return;
        }

        await fetchDisplayTraining(activeCategory, categories);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    role,
    activeTab,
    activeCategory,
    activeStatus,
    fetchDisplayCategories,
    fetchTrainingVideos,
    fetchProductTraining,
    fetchDisplayTraining,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadTrainingData();
    }, [loadTrainingData]),
  );

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
    if (route.params?.status) {
      setActiveStatus(route.params.status);
    }
  }, [route.params?.tab, route.params?.status, route.params?.ts]);

  const openDetail = product => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleMarkCompleted = async product => {
    if (product?.id) {
      await updateTrainingItemStatus(product.id, () => {
        setProductData(prev =>
          prev.map(item =>
            item.id === product.id ? { ...item, status: 'Completed' } : item,
          ),
        );
      });
    }

    setModalVisible(false);
    setSelectedProduct(null);
    setActiveTab('Product');
    setActiveStatus('Completed');
  };

  const handleDisplayAudioPlay = item => {
    if (!item?.id || /complete/i.test(String(item?.status ?? ''))) {
      return;
    }

    updateTrainingItemStatus(item.id, () => {
      setDisplayData(prev =>
        prev.map(displayItem =>
          displayItem.id === item.id
            ? { ...displayItem, status: 'Completed' }
            : displayItem,
        ),
      );
    });
  };

  const handlePlayVideo = async item => {
    if (!item?.videoUrl) {
      Toast.show('Video not available', Toast.LONG);
      return;
    }

    console.log(
      'Training Video Clicked:',
      JSON.stringify(
        {
          id: item?.id ?? null,
          title: item?.title ?? '',
          videoUrl: item?.videoUrl,
        },
        null,
        2,
      ),
    );

    if (item?.id) {
      await updateTrainingItemStatus(item.id, () => {
        setCustomerData(prev => prev.filter(video => video.id !== item.id));
      });
    }

    if (isExternalVideoLink(item.videoUrl)) {
      try {
        await Linking.openURL(item.videoUrl);
      } catch (error) {
        Toast.show('Unable to open video', Toast.LONG);
      }
      return;
    }

    setActiveVideo(item);
  };

  const activeList =
    activeTab === 'Customer'
      ? customerData
      : activeTab === 'Product'
        ? productData
        : displayData;

  const emptyMessage =
    activeTab === 'Product'
      ? 'No product training available'
      : activeTab === 'Display'
        ? 'No display training available'
        : 'No training videos available';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.headerArea}>
        <TrainingHeader />
        <TrainingTabs
          active={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <ScreenLoader />
        ) : (
          <>
            {activeTab === 'Display' && (
              <TrainingDisplayCategories
                active={activeCategory}
                onChange={setActiveCategory}
                categories={displayCategoryLabels}
              />
            )}

            <TrainingStatusChips active={activeStatus} onChange={setActiveStatus} />

            {activeTab === 'Customer' &&
              customerData.map(item => (
                <TrainingCustomerCard
                  key={item.id}
                  item={item}
                  onPlay={handlePlayVideo}
                />
              ))}

            {activeTab === 'Product' &&
              productData.map(item => (
                <TrainingProductCard
                  key={item.id}
                  item={item}
                  onViewDetail={openDetail}
                />
              ))}

            {activeTab === 'Display' &&
              displayData.map(item => (
                <TrainingDisplayCard
                  key={item.id}
                  item={item}
                  onAudioPlay={handleDisplayAudioPlay}
                />
              ))}

            {!activeList.length ? (
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <TrainingDetailModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        onMarkCompleted={handleMarkCompleted}
      />

      <TrainingVideoModal
        visible={Boolean(activeVideo)}
        title={activeVideo?.title ?? ''}
        videoUrl={activeVideo?.videoUrl}
        onClose={() => setActiveVideo(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerArea: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: Fonts.poppinsRegular,
    fontSize: Fontsize.xs2,
    color: Colors.mediumGrey,
    marginTop: hp(4),
  },
});

export default Training;
