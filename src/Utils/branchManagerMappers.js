import { Images } from '../Assets';
import { Colors } from '../Constants/Colors';
import { categoryColorMap } from '../Constants/CategoryColors';
import { Strings } from '../Constants/Strings';
import {
  formatStaffCommissionDisplay,
  getCommissionFromRawApiItem,
  getStaffIdFromRawApiItem,
  getStaffNameFromRawApiItem,
  getValidStaffId,
  parseCommissionAmount,
} from './staffHelpers';

const CATEGORY_ORDER = ['garments', 'unstitched', 'accessories'];

const categoryStyleMap = {
  garments: {
    iconSource: Images.Garments,
    iconBg: Colors.darkgreen,
    progressColor: Colors.branchGreen,
    iconTintColor: Colors.branchGreen,
  },
  unstitched: {
    iconSource: Images.unstiched,
    iconBg: Colors.whiteOrange,
    progressColor: Colors.vividAmber,
    iconTintColor: Colors.vividAmber,
  },
  accessories: {
    iconSource: Images.Accesories,
    iconBg: Colors.lightBlue,
    progressColor: Colors.brightBlue,
    iconTintColor: Colors.brightBlue,
  },
};

const getCategoryKey = categoryName =>
  categoryName?.toLowerCase?.().replace(/\s+/g, '') ?? '';

const formatCategoryTitle = category => {
  const value = String(category ?? '').trim();

  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const isMonthlyTargetCategoryList = data =>
  Array.isArray(data) &&
  data.length > 0 &&
  data.every(
    item =>
      item?.category != null &&
      (item?.monthly_target != null ||
        item?.target != null ||
        item?.monthlyTarget != null),
  );

const mapMonthlyTargetCategoriesFromList = items =>
  (items ?? []).map(item => ({
    title: formatCategoryTitle(item?.category ?? item?.name ?? ''),
    target: Number(item?.monthly_target ?? item?.target ?? item?.monthlyTarget ?? 0),
    assigned: Number(item?.assigned_target ?? item?.assigned ?? 0),
    remaining: Number(item?.remaining_target ?? item?.remaining ?? 0),
  }));

const getCategoryDotColor = categoryName => {
  const key = getCategoryKey(categoryName);
  return categoryColorMap[key] || Colors.blueGrey;
};

const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const WEEK_SHORT_LABELS = ['W1', 'W2', 'W3', 'W4'];
const WEEK_KEYS = ['week1', 'week2', 'week3', 'week4'];

const getStatusColor = status => {
  const normalized = status?.toLowerCase?.() ?? '';

  if (normalized.includes('done')) {
    return Colors.branchGreen;
  }

  if (normalized.includes('early') || normalized.includes('cf')) {
    return Colors.vividAmber;
  }

  if (normalized.includes('mv')) {
    return Colors.brightBlue;
  }

  if (normalized.includes('active')) {
    return Colors.brightBlue;
  }

  return Colors.black;
};

const getWeekTargetUnits = (weeklyTargets, key, index) =>
  Number(
    weeklyTargets?.[key] ??
      weeklyTargets?.[WEEK_LABELS[index]] ??
      weeklyTargets?.[index] ??
      (Array.isArray(weeklyTargets) ? weeklyTargets[index] : 0) ??
      0,
  );

const getWeekPerformanceData = (weeklyPerformance, key, index) => {
  if (weeklyPerformance == null) {
    return null;
  }

  if (Array.isArray(weeklyPerformance)) {
    return weeklyPerformance[index] ?? null;
  }

  return (
    weeklyPerformance?.[key] ??
    weeklyPerformance?.[WEEK_LABELS[index]] ??
    weeklyPerformance?.[index] ??
    null
  );
};

const getWeekAchievedUnits = weekData => {
  if (weekData == null || weekData === '') {
    return 0;
  }

  if (typeof weekData === 'number' || typeof weekData === 'string') {
    const numeric = Number(weekData);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return Number(
    weekData?.achieved ??
      weekData?.units ??
      weekData?.sale ??
      weekData?.achievement ??
      0,
  );
};

const getWeekOverAchieved = (weeklyOverAchieved, key, index) => {
  if (weeklyOverAchieved == null) {
    return 0;
  }

  if (Array.isArray(weeklyOverAchieved)) {
    return Number(weeklyOverAchieved[index] ?? 0);
  }

  return Number(
    weeklyOverAchieved?.[key] ??
      weeklyOverAchieved?.[WEEK_LABELS[index]] ??
      weeklyOverAchieved?.[index] ??
      0,
  );
};

const getWeekCarryForward = (weeklyCarryForward, key, index) => {
  if (weeklyCarryForward == null) {
    return 0;
  }

  if (Array.isArray(weeklyCarryForward)) {
    return Number(weeklyCarryForward[index] ?? 0);
  }

  return Number(
    weeklyCarryForward?.[key] ??
      weeklyCarryForward?.[WEEK_LABELS[index]] ??
      weeklyCarryForward?.[index] ??
      0,
  );
};

const formatWeekStatusAmount = value => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Number.isInteger(amount) ? amount : Math.round(amount * 10) / 10;
};

const getCurrentMonthWeekIndex = () => {
  const day = new Date().getDate();

  if (day <= 7) {
    return 0;
  }

  if (day <= 14) {
    return 1;
  }

  if (day <= 21) {
    return 2;
  }

  return 3;
};

const resolveWeekStatus = (
  units,
  targetUnits,
  carryForwardAmount,
  overAchievedAmount,
  weekData,
  weekIndex,
  currentWeekIndex,
) => {
  if (weekData?.status) {
    return {
      status: weekData.status,
      statusNote: null,
      statusNoteColor: null,
    };
  }

  const carryForward = formatWeekStatusAmount(carryForwardAmount);
  const overAchieved = formatWeekStatusAmount(overAchievedAmount);
  const isDone = targetUnits > 0 && units >= targetUnits;

  if (carryForward > 0) {
    return {
      status: `${carryForward} CF`,
      statusNote: null,
      statusNoteColor: null,
    };
  }

  if (isDone) {
    return {
      status: Strings.done,
      statusNote: overAchieved > 0 ? `${overAchieved} MV` : null,
      statusNoteColor: overAchieved > 0 ? Colors.brightBlue : null,
    };
  }

  if (overAchieved > 0) {
    return {
      status: `${overAchieved} MV`,
      statusNote: null,
      statusNoteColor: null,
    };
  }

  if (weekIndex === currentWeekIndex) {
    return {
      status: 'Active',
      statusNote: null,
      statusNoteColor: null,
    };
  }

  return {
    status: Strings.next,
    statusNote: null,
    statusNoteColor: null,
  };
};

const buildWeeklyPerformanceItem = (
  index,
  units,
  targetUnits,
  weekData,
  totalTarget = 0,
  carryForwardAmount = 0,
  overAchievedAmount = 0,
  currentWeekIndex = getCurrentMonthWeekIndex(),
) => {
  const rawPercent = Number(
    weekData?.percentage ??
      weekData?.achievement_percentage ??
      weekData?.percent ??
      (targetUnits ? Math.round((units / targetUnits) * 100) : 0),
  );
  let percent = Math.min(100, Math.max(0, rawPercent));

  if (targetUnits > 0 && units >= targetUnits) {
    percent = 100;
  }

  const progress = Math.min(1, Math.max(0, percent / 100));
  const statusDetails = resolveWeekStatus(
    units,
    targetUnits,
    carryForwardAmount,
    overAchievedAmount,
    weekData,
    index,
    currentWeekIndex,
  );

  return {
    week: WEEK_SHORT_LABELS[index],
    progress,
    percent,
    units,
    status: statusDetails.status,
    statusNote: statusDetails.statusNote,
    statusNoteColor: statusDetails.statusNoteColor,
    statusColor: getStatusColor(statusDetails.status),
  };
};

const distributeAchievedAcrossWeeks = (totalAchieved, weeklyTargets, totalTarget = 0) => {
  const achievedTotal = Number(totalAchieved) || 0;
  const targetUnitsList = WEEK_KEYS.map((key, index) =>
    getWeekTargetUnits(weeklyTargets, key, index),
  );
  const targetSum = targetUnitsList.reduce((sum, value) => sum + value, 0);
  let remaining = achievedTotal;

  return WEEK_KEYS.map((key, index) => {
    const targetUnits = targetUnitsList[index];
    let units = 0;

    if (achievedTotal <= 0) {
      units = 0;
    } else if (index === WEEK_KEYS.length - 1) {
      units = remaining;
    } else if (targetSum > 0) {
      units = Math.round((achievedTotal * targetUnits) / targetSum);
      remaining -= units;
    } else if (index === 0) {
      units = achievedTotal;
    }

    return buildWeeklyPerformanceItem(
      index,
      units,
      targetUnits,
      null,
      totalTarget,
      0,
      0,
      getCurrentMonthWeekIndex(),
    );
  });
};

const mapWeeklyTargets = (weeklyTargets, totalTarget) =>
  WEEK_KEYS.map((key, index) => {
    const units = getWeekTargetUnits(weeklyTargets, key, index);
    const badgePercent = totalTarget
      ? Math.round((units / totalTarget) * 100)
      : 0;

    return {
      week: WEEK_LABELS[index],
      units,
      badge: `${badgePercent}%`,
    };
  });

const mapWeeklyPerformance = (
  weeklyPerformance,
  weeklyTargets,
  totalAchieved = 0,
  weeklyOverAchieved = {},
  totalTarget = 0,
  weeklyCarryForward = {},
) => {
  const currentWeekIndex = getCurrentMonthWeekIndex();
  const weeklyItems = WEEK_KEYS.map((key, index) => {
    const weekData = getWeekPerformanceData(weeklyPerformance, key, index);
    const targetUnits = getWeekTargetUnits(weeklyTargets, key, index);
    const units = getWeekAchievedUnits(weekData);
    const carryForwardAmount = getWeekCarryForward(weeklyCarryForward, key, index);
    const overAchievedAmount = getWeekOverAchieved(weeklyOverAchieved, key, index);

    return buildWeeklyPerformanceItem(
      index,
      units,
      targetUnits,
      weekData,
      totalTarget,
      carryForwardAmount,
      overAchievedAmount,
      currentWeekIndex,
    );
  });

  const hasMeaningfulWeeklyPerformance = weeklyItems.some(item => item.units > 0);

  if (!hasMeaningfulWeeklyPerformance && Number(totalAchieved) > 0) {
    return distributeAchievedAcrossWeeks(totalAchieved, weeklyTargets, totalTarget);
  }

  return weeklyItems;
};

export const mapBranchManagerCommission = items =>
  (items ?? []).map((item, index) => ({
    id: item?.category ?? String(index + 1),
    categoryName: item?.category ?? '',
    target: String(item?.target ?? 0),
    achieved: String(item?.achieved ?? 0),
    commission: formatStaffCommissionDisplay(getCommissionFromRawApiItem(item)),
    dotColor: getCategoryDotColor(item?.category),
  }));

const mapBranchAchievementRow = (branch, suffix = '') => ({
  rank: branch?.rank ?? 0,
  name: suffix
    ? `${branch?.branch ?? branch?.branch_name ?? ''} (${suffix})`
    : branch?.branch ?? branch?.branch_name ?? '',
  achieved:
    branch?.achievement_percentage ??
    branch?.achieved_percentage ??
    branch?.achievement ??
    branch?.achieved ??
    0,
  remaining: branch?.remaining_percentage ?? branch?.remaining ?? 0,
});

export const mapBranchManagerStaffComparison = items =>
  (items ?? []).map((item, index) => {
    const staffId = getStaffIdFromRawApiItem(item);

    return {
      id: staffId != null ? String(staffId) : `staff-row-${index}`,
      staff_id: staffId,
      rank: item?.rank ?? index + 1,
      name: getStaffNameFromRawApiItem(item) || item?.staff_name || '',
      achieved: Number(
        item?.achieved_percentage ??
          item?.achievement_percentage ??
          item?.achieved ??
          0,
      ),
      remaining: Number(
        item?.remaining_percentage ?? item?.remaining ?? 0,
      ),
      commission: formatStaffCommissionDisplay(getCommissionFromRawApiItem(item)),
      target: item?.target ?? 0,
    };
  });

export const mapBranchManagerBranchComparison = data => {
  const categories = data ?? [];
  const getCategoryItem = categoryName =>
    categories.find(
      item => getCategoryKey(item?.category) === getCategoryKey(categoryName),
    );

  const mapCategoryBlock = categoryItem => ({
    rows: (categoryItem?.branches ?? []).map(branch =>
      mapBranchAchievementRow(branch),
    ),
    yoursRow: categoryItem?.your_branch
      ? mapBranchAchievementRow(categoryItem.your_branch, 'Team')
      : { rank: 0, name: '', achieved: 0, remaining: 0 },
  });

  const garmentsBlock = mapCategoryBlock(getCategoryItem('Garments'));
  const unstitchedBlock = mapCategoryBlock(getCategoryItem('Unstitched'));
  const accessoriesBlock = mapCategoryBlock(getCategoryItem('Accessories'));

  return {
    garmentsData: garmentsBlock.rows,
    unstitchedData: unstitchedBlock.rows,
    accessoriesData: accessoriesBlock.rows,
    garmentsYoursRow: garmentsBlock.yoursRow,
    unstitchedYoursRow: unstitchedBlock.yoursRow,
    accessoriesYoursRow: accessoriesBlock.yoursRow,
    teamAchievementRow: garmentsBlock.yoursRow,
  };
};

export const mapBetaDashboardToManagerSummary = dashboard => {
  const commission = dashboard?.commission ?? {};
  const branchMonthlyTarget = Number(commission?.target ?? 0);
  const achieved = Number(commission?.sale ?? 0);

  return {
    branchMonthlyTarget,
    achieved,
    remaining: Math.max(0, branchMonthlyTarget - achieved),
    commission: parseCommissionAmount(commission?.commission),
    achievedPercent: Number(commission?.achieved_percentage ?? 0),
    remainingPercent: Number(commission?.remaining_percentage ?? 0),
  };
};

export const mapDashboardTargetToCategoryRaw = items =>
  (items ?? []).map(item => {
    const target = Number(item?.target ?? 0);
    const achieved = Number(item?.achieved ?? 0);
    const weeklyUnit = target ? Math.round(target / 4) : 0;

    return {
      category: item?.category,
      target,
      achieved,
      remaining: Math.max(0, target - achieved),
      achievement_percentage: Number(item?.achieved_percentage ?? 0),
      weekly_targets: {
        week1: weeklyUnit,
        week2: weeklyUnit,
        week3: weeklyUnit,
        week4: Math.max(0, target - weeklyUnit * 3),
      },
    };
  });

export const mapBranchManagerDashboard = data => {
  const achievedPercent = Number(data?.achieved_percentage ?? 0);
  const remainingPercent = Number(
    data?.remaining_percentage ?? Math.max(0, 100 - achievedPercent),
  );

  return {
    branchMonthlyTarget: data?.branch_monthly_target ?? 0,
    achieved: data?.achieved ?? 0,
    remaining: data?.remaining ?? 0,
    commission: data?.commission ?? 0,
    achievedPercent,
    remainingPercent,
  };
};

export const mapBranchManagerPerformanceSummary = items => {
  const list = items ?? [];
  const branchMonthlyTarget = list.reduce(
    (sum, item) => sum + Number(item?.target ?? 0),
    0,
  );
  const achieved = list.reduce(
    (sum, item) => sum + Number(item?.achieved ?? 0),
    0,
  );
  const commission = list.reduce(
    (sum, item) => sum + Number(item?.commission ?? 0),
    0,
  );
  const remaining = Math.max(0, branchMonthlyTarget - achieved);
  const achievedPercent = branchMonthlyTarget
    ? Math.round((achieved / branchMonthlyTarget) * 100)
    : 0;
  const remainingPercent = Math.max(0, 100 - achievedPercent);

  return {
    branchMonthlyTarget,
    achieved,
    remaining,
    commission,
    achievedPercent,
    remainingPercent,
  };
};

export const mapBranchManagerCategoryPerformance = items => {
  const mapped = (items ?? []).map((item, index) => {
    const categoryKey = getCategoryKey(item?.category);
    const style = categoryStyleMap[categoryKey] ?? categoryStyleMap.garments;
    const weeklyTargets = item?.weekly_targets ?? item?.weeklyTargets ?? {};
    const weeklyPerformance =
      item?.weekly_performance ??
      item?.weeklyPerformance ??
      item?.weekly_achieved ??
      item?.weeklyAchieved ??
      {};
    const weeklyOverAchieved =
      item?.weekly_over_achieved ?? item?.weeklyOverAchieved ?? {};
    const weeklyCarryForward =
      item?.weekly_carry_forward ?? item?.weeklyCarryForward ?? {};
    const target = Number(item?.target ?? 0);
    const achieved = Number(item?.achieved ?? 0);

    return {
      id: categoryKey || String(index + 1),
      title: item?.category ?? '',
      target,
      achieved,
      remaining: Number(item?.remaining ?? Math.max(0, target - achieved)),
      achievementPercent: Number(
        item?.achievement_percentage ?? item?.achievementPercent ?? 0,
      ),
      ...style,
      branchTargets: mapWeeklyTargets(weeklyTargets, target),
      weeklyPerformance: mapWeeklyPerformance(
        weeklyPerformance,
        weeklyTargets,
        achieved,
        weeklyOverAchieved,
        target,
        weeklyCarryForward,
      ),
      sortOrder: CATEGORY_ORDER.indexOf(categoryKey),
    };
  });

  return mapped.sort((a, b) => {
    const orderA = a.sortOrder === -1 ? CATEGORY_ORDER.length : a.sortOrder;
    const orderB = b.sortOrder === -1 ? CATEGORY_ORDER.length : b.sortOrder;
    return orderA - orderB;
  });
};

export const buildCategoryWeeklyChartData = categoryItem => {
  const targets = categoryItem?.branchTargets ?? [];
  const performance = categoryItem?.weeklyPerformance ?? [];

  if (!targets.length) {
    return {
      chartData: [],
      chartData2: [],
      chartMaxValue: 10,
      chartSections: 4,
    };
  }

  const chartData = targets.map((target, index) => {
    const achievedUnits = Number(performance[index]?.units ?? 0);
    const targetUnits = Number(target?.units ?? 0);
    const label = target?.week?.replace?.('Week ', 'W') ?? `W${index + 1}`;
    const rate = targetUnits
      ? Math.round((achievedUnits / targetUnits) * 100)
      : 0;

    return {
      value: targetUnits,
      label,
      customData: {
        footfall: targetUnits,
        invoices: achievedUnits,
        rate,
        day: label,
      },
    };
  });

  const chartData2 = performance.map(item => ({
    value: Number(item?.units ?? 0),
  }));

  const maxValue = Math.max(
    ...chartData.map(item => item.value),
    ...chartData2.map(item => item.value),
    1,
  );

  const chartMaxValue =
    maxValue <= 5
      ? 5
      : maxValue <= 10
        ? 10
        : maxValue <= 25
          ? 25
          : maxValue <= 50
            ? 50
            : maxValue <= 100
              ? 100
              : Math.ceil(maxValue / 10) * 10;

  return {
    chartData,
    chartData2,
    chartMaxValue,
    chartSections: chartMaxValue <= 25 ? 4 : 5,
  };
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ASSIGNMENT_AVATAR_COLORS = [
  '#CFF5EA',
  '#DDE3FF',
  '#FFE8BF',
  '#F2D8FF',
  '#FFD8E3',
  '#D4F5E9',
  '#D8E1FF',
];

const getStaffInitials = name => {
  if (!name) {
    return '';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');
};

export const getCurrentMonthYearLabels = () => {
  const now = new Date();

  return {
    month: MONTH_NAMES[now.getMonth()],
    year: now.getFullYear(),
  };
};

export const mapBranchManagerStaffForAssignment = (items, nameLookup = new Map()) =>
  (items ?? []).map((item, index) => {
    const staffId = getStaffIdFromRawApiItem(item);
    const name =
      getStaffNameFromRawApiItem(item) ||
      (staffId != null ? nameLookup.get(staffId) : '') ||
      (staffId != null ? `Staff ${staffId}` : `Staff ${index + 1}`);

    return {
      id: staffId != null ? String(staffId) : `staff-row-${index}`,
      sale_staff_id: staffId,
      name,
      initials: getStaffInitials(name),
      color: ASSIGNMENT_AVATAR_COLORS[index % ASSIGNMENT_AVATAR_COLORS.length],
      garments: item?.garments != null ? String(item.garments) : '',
      unstitched: item?.unstitched != null ? String(item.unstitched) : '',
      accessories: item?.accessories != null ? String(item.accessories) : '',
      assigned: item?.assigned === true || item?.assigned === 1,
    };
  });

const buildStaffNameLookup = data => {
  const lookup = new Map();
  const staffSources = [
    data?.staff,
    data?.sales_staff,
    data?.staff_list,
    data?.staff_members,
    data?.targets,
    data?.staff_targets,
    data?.assignments,
  ].filter(Array.isArray);

  staffSources.forEach(list => {
    list.forEach(member => {
      const staffId = getStaffIdFromRawApiItem(member);
      const name = getStaffNameFromRawApiItem(member);

      if (staffId != null && name) {
        lookup.set(staffId, name);
      }
    });
  });

  return lookup;
};

const mergeMonthlyTargetStaffRows = data => {
  if (Array.isArray(data)) {
    if (isMonthlyTargetCategoryList(data)) {
      return [];
    }

    return data;
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const staffItems = [
    ...(data?.staff ?? []),
    ...(data?.sales_staff ?? []),
    ...(data?.staff_list ?? []),
    ...(data?.staff_members ?? []),
  ];

  const targetItems = [
    ...(data?.targets ?? []),
    ...(data?.staff_targets ?? []),
    ...(data?.assignments ?? []),
  ];

  if (!staffItems.length && !targetItems.length) {
    return [];
  }

  if (!staffItems.length) {
    return targetItems;
  }

  if (!targetItems.length) {
    return staffItems;
  }

  const mergedById = new Map();

  [...staffItems, ...targetItems].forEach(item => {
    const staffId = getStaffIdFromRawApiItem(item);

    if (staffId == null) {
      return;
    }

    mergedById.set(staffId, {
      ...(mergedById.get(staffId) || {}),
      ...item,
    });
  });

  if (mergedById.size) {
    return Array.from(mergedById.values());
  }

  const maxLen = Math.max(staffItems.length, targetItems.length);

  return Array.from({ length: maxLen }, (_, index) => ({
    ...(staffItems[index] || {}),
    ...(targetItems[index] || {}),
  }));
};

export const getMonthlyTargetsStaffList = data => mergeMonthlyTargetStaffRows(data);

export const mapMonthlyTargets = data => {
  const nameLookup = buildStaffNameLookup(data);
  const staffList = getMonthlyTargetsStaffList(data);

  return {
    staff: mapBranchManagerStaffForAssignment(staffList, nameLookup),
    categories: mapMonthlyTargetCategories(data),
  };
};

export const mapTargetAssignmentScreenData = (monthlyData, staffItems = []) => {
  const comparisonStaff = Array.isArray(staffItems) ? staffItems : [];
  const monthlyStaff = getMonthlyTargetsStaffList(monthlyData);
  const staffSource = mergeMonthlyTargetStaffRows({
    staff: comparisonStaff,
    targets: monthlyStaff,
  });

  const resolvedStaff =
    staffSource.length > 0
      ? staffSource
      : comparisonStaff.length
        ? comparisonStaff
        : monthlyStaff;

  return {
    staff: mapBranchManagerStaffForAssignment(
      resolvedStaff,
      buildStaffNameLookup(monthlyData),
    ),
    categories: mapMonthlyTargetCategories(monthlyData),
  };
};

export const mapMonthlyTargetCategories = data => {
  if (isMonthlyTargetCategoryList(data)) {
    return mapMonthlyTargetCategoriesFromList(data);
  }

  if (Array.isArray(data?.categories)) {
    return data.categories.map(item => ({
      title: item?.category ?? item?.name ?? '',
      target: Number(item?.monthly_target ?? item?.target ?? 0),
      assigned: Number(item?.assigned_target ?? item?.assigned ?? 0),
      remaining: Number(item?.remaining_target ?? item?.remaining ?? 0),
    }));
  }

  return [
    {
      title: 'Garments',
      target: Number(data?.garments_target ?? data?.garments ?? 0),
      assigned: 0,
      remaining: 0,
    },
    {
      title: 'Unstitched',
      target: Number(data?.unstitched_target ?? data?.unstitched ?? 0),
      assigned: 0,
      remaining: 0,
    },
    {
      title: 'Accessories',
      target: Number(data?.accessories_target ?? data?.accessories ?? 0),
      assigned: 0,
      remaining: 0,
    },
  ];
};

const hasAssignmentValues = row =>
  Number(row?.garments || 0) > 0 ||
  Number(row?.unstitched || 0) > 0 ||
  Number(row?.accessories || 0) > 0;

export const sumAssignmentTargets = rows =>
  (rows ?? []).reduce(
    (acc, row) => ({
      garments: acc.garments + Number(row?.garments || 0),
      unstitched: acc.unstitched + Number(row?.unstitched || 0),
      accessories: acc.accessories + Number(row?.accessories || 0),
    }),
    { garments: 0, unstitched: 0, accessories: 0 },
  );

export const mapBranchManagerTargetSummary = (categoryItems, assignedTotals) => {
  const findCategory = key =>
    (categoryItems ?? []).find(item => getCategoryKey(item?.title) === key);

  const buildRow = key => {
    const category = findCategory(key);
    const target = Number(category?.target ?? 0);
    const baseAssigned = Number(category?.assigned ?? 0);
    const assigned = baseAssigned + Number(assignedTotals?.[key] ?? 0);
    const remaining =
      Number(assignedTotals?.[key] ?? 0) === 0 && category?.remaining != null
        ? Number(category.remaining)
        : Math.max(0, target - assigned);

    return {
      key,
      target,
      assigned,
      left: remaining,
    };
  };

  const garments = buildRow('garments');
  const unstitched = buildRow('unstitched');
  const accessories = buildRow('accessories');

  return {
    categories: [garments, unstitched, accessories],
    totalAssigned:
      garments.assigned + unstitched.assigned + accessories.assigned,
  };
};

export const buildBranchManagerAssignTargetsPayload = (rows, month, year) => ({
  month,
  year,
  targets: (rows ?? [])
    .filter(row => getValidStaffId(row) && hasAssignmentValues(row))
    .map(row => ({
      sale_staff_id: getValidStaffId(row),
      garments: Number(row.garments || 0),
      unstitched: Number(row.unstitched || 0),
      accessories: Number(row.accessories || 0),
    })),
});

export const isAssignTargetsSuccess = resJson =>
  resJson?.status == null ||
  resJson?.status === undefined ||
  resJson?.status == 200;

export const getAssignTargetsValidationError = rows => {
  const rowsWithValues = (rows ?? []).filter(hasAssignmentValues);

  if (!rowsWithValues.length) {
    return 'Please enter at least one target value';
  }

  const rowsWithStaffId = rowsWithValues.filter(row => getValidStaffId(row));

  if (!rowsWithStaffId.length) {
    return 'Staff ID not found. Please reopen Target Assignment screen.';
  }

  return null;
};

const getSectionAvailableTarget = category => {
  const remaining = category?.remaining;

  if (remaining != null) {
    return Math.max(0, Number(remaining));
  }

  const target = Number(category?.target ?? 0);
  const assigned = Number(category?.assigned ?? 0);

  return Math.max(0, target - assigned);
};

export const getAssignTargetsSectionError = (categoryItems, assignedTotals) => {
  const findCategory = key =>
    (categoryItems ?? []).find(item => getCategoryKey(item?.title) === key);

  const hasBlockedSection = CATEGORY_ORDER.some(key => {
    const entered = Number(assignedTotals?.[key] ?? 0);

    if (entered <= 0) {
      return false;
    }

    return getSectionAvailableTarget(findCategory(key)) <= 0;
  });

  return hasBlockedSection
    ? 'You can only assign targets for sections with available targets in the Monthly Targets Calculator.'
    : null;
};

export const mapBranchManagerAssignTargetsResponse = data => {
  if (data == null) {
    return {};
  }

  if (Array.isArray(data)) {
    return {
      targets: mapBranchManagerStaffForAssignment(data),
    };
  }

  const targetsList = getMonthlyTargetsStaffList(data);

  return {
    month: data?.month ?? null,
    year: data?.year ?? null,
    total:
      data?.total ??
      data?.total_assigned ??
      data?.assigned_count ??
      null,
    targets: mapBranchManagerStaffForAssignment(targetsList),
  };
};
