import axios from 'axios';
import Toast from 'react-native-simple-toast';
import Config from './Config';
import { getStaffDetailsEndpoint } from '../Utils/staffHelpers';
import { getApiMessage } from '../Utils/apiHelpers';

axios.defaults.headers.common['Cache-Control'] = 'no-cache';
axios.defaults.headers.common.Accept = 'application/json';
axios.defaults.timeout = 20000;

if (__DEV__) {
  console.log('API baseURL:', Config.baseURL);
}

let authToken = null;

export const getAuthToken = () => authToken;

export const setAuthToken = token => {
  authToken = token;

  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

axios.interceptors.request.use(
  config => {
    if (authToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${authToken}`,
      };
    }
    return config;
  },
  error => Promise.reject(error),
);

axios.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = String(error?.config?.url ?? '');
    const isLoginRequest = requestUrl.includes('login');
    const isApiRequest =
      requestUrl.startsWith(Config.baseURL) ||
      requestUrl.includes('/limelight/api/');

    if (isApiRequest && !isLoginRequest) {
      const message = getApiMessage(null, error);

      if (message) {
        Toast.show(message, Toast.LONG);
      }
    }

    if (error?.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(error);
  },
);

const requests = {
  get: url => axios.get(`${Config.baseURL}${url}`),
  post: (url, data, config = {}) =>
    axios.post(`${Config.baseURL}${url}`, data, config),
  put: (url, data, config = {}) =>
    axios.put(`${Config.baseURL}${url}`, data, config),
  delete: url => axios.delete(`${Config.baseURL}${url}`),
};

export const isApiSuccess = response => {
  if (!response) {
    return false;
  }

  const httpStatus = response?.status;
  const bodyStatus = response?.data?.status;

  if (httpStatus == 200) {
    return true;
  }

  return bodyStatus == 200;
};

export const getSlipBoundIncentiveList = responseData => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  const payload = responseData?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.incentives ?? payload?.slip_bound_incentive ?? [];
};

export const formatApiAppResponse = (response, data) => {
  const resJson = response?.data;

  return {
    status: resJson?.status ?? response?.status,
    message: resJson?.message,
    data,
  };
};

const Api = {
  login: data => requests.post('login', data),
  logout: () => requests.delete('logout'),
  sendOtp: data => requests.post('sendotp', data),
  resendOtp: data => requests.post('resendotp', data),
  verifyOtp: data => requests.post('verifyotp', data),
  resetPassword: data => requests.post('resetpassword', data),
  changePassword: data => requests.post('changepassword', data),
  getProfile: () => requests.get('getprofile'),
  updateProfile: data => requests.post('update-profile', data),
  staffFeedback: data => requests.post('staff-feedback', data),
  asmFeedback: data => requests.post('asm-feedback', data),
  getSurveyQuestions: () => requests.get('surveys'),
  getSurveyDetail: id => requests.get(`surveys/${id}`),
  submitSurvey: (id, data) => requests.post(`surveys/${id}/submit`, data),
  getSurveyReport: (surveyId, branchId) => {
    const query = branchId
      ? `?branch_id=${encodeURIComponent(branchId)}`
      : '';

    return requests.get(`surveys/${surveyId}/report${query}`);
  },
  getSurveyResponses: (surveyId, branchId, status = 'all') =>
    requests.get(
      `surveys/${surveyId}/responses?branch_id=${encodeURIComponent(branchId)}&status=${encodeURIComponent(status)}`,
    ),
  getAsmBranches: () => requests.get('asm-branches'),
  getTrainingVideos: status =>
    requests.get(`training-videos?status=${encodeURIComponent(status)}`),
  updateTrainingVideoStatus: (id, data) =>
    requests.post(`training-videos/${id}/status`, data),
  getDisplayCategories: () => requests.get('display-categories'),
  getProductTraining: status =>
    requests.get(`product-training?status=${encodeURIComponent(status)}`),
  getTrainingDisplay: (category, status) =>
    requests.get(
      `training-display?category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`,
    ),
  getAnnouncements: category => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';

    return requests.get(`announcements${query}`);
  },
  getCategoryBreakdown: () => requests.get('category-breakdown'),
  getDashboard: () => requests.get('dashboard'),
  getSlipBoundIncentive: () => requests.get('slip-bound-incentive'),
  getConversionRate: (from, to) =>
    requests.get(`conversion-rate?from=${from}&to=${to}`),
  getBranchManagerDashboard: () => requests.get('branch-manager-dashboard'),
  getBranchManagerCommission: () => requests.get('branch-manager-commission'),
  getBranchManagerCategoryPerformance: () =>
    requests.get('branch-manager-category-performance'),
  getBranchManagerStaffComparison: type =>
    requests.get(`branch-manager-staff-comparison?type=${type}`),
  getBranchManagerBranchComparison: type =>
    requests.get(`branch-manager-branch-comparison?type=${type}`),
  getMonthlyTargets: () => requests.get('monthly-targets'),
  assignBranchManagerTargets: data =>
    requests.post('branch-manager/assign-targets', data),
  getAsmBranchComparison: type =>
    requests.get(`asm-branch-comparison?type=${type}`),
  getAsmBranchConversion: type =>
    requests.get(`asm-branch-conversion?type=${type}`),
  getAsmRegionComparison: type =>
    requests.get(`asm-regions-comparison?type=${type}`),
  getAsmRegionConversion: type =>
    requests.get(`asm-region-comparison?type=${type}`),
  getAsmStaffComparison: type =>
    requests.get(`asm-staff-comparison?type=${type}`),
  getNotifications: () => requests.get('notifications'),
  markNotificationRead: id => requests.post(`notifications/${id}/read`, {}),
  getSalesStaffComparison: type =>
    requests.get(`sales-staff-comparison?type=${type}`),
  getAsmBranchTargets: () => requests.get('asm-branch-targets'),
  getStaffDetails: (id, role) =>
    requests.get(getStaffDetailsEndpoint(id, role)),
};

export default Api;
