export type AdsRuleConfig = {
  targetCtr: number;
  cooldownMinutes: number;
  maxChangePercentPerRun: number;
  minCpm: number;
  maxCpm: number;
  dailySpendLimitRub: number;
  dryRun: boolean;
};

export const ADS_AUTOPILOT_CONFIG: AdsRuleConfig = {
  targetCtr: 3,
  cooldownMinutes: 60,
  maxChangePercentPerRun: 10,
  minCpm: 80,
  maxCpm: 600,
  dailySpendLimitRub: 15000,
  dryRun: true,
};

export type AdsRowInput = {
  keyword: string;
  impressions: number;
  clicks: number;
  spend: number;
  orders: number;
  ctr: number;
  cpc: number;
};

export type AdsDecision = {
  recommendation: string;
  wbAction: string;
};

export const evaluateAdsRow = (row: AdsRowInput, config: AdsRuleConfig = ADS_AUTOPILOT_CONFIG): AdsDecision => {
  const { clicks, orders, ctr, impressions } = row;

  if (clicks >= 20 && orders === 0 && ctr < 2) {
    return {
      recommendation: 'Отключить / в минус-слова',
      wbAction: 'Добавить нерелевантные фразы в минус-слова',
    };
  }

  if (clicks >= 12 && orders === 0) {
    return {
      recommendation: 'Снизить общую ставку кампании',
      wbAction: `Снизить общий CPM по кампании/группе (шаг до ${config.maxChangePercentPerRun}%)`,
    };
  }

  if (orders >= 2 && ctr >= config.targetCtr) {
    return {
      recommendation: 'Масштабировать',
      wbAction: 'Повысить общий CPM или вынести кластер в отдельную кампанию',
    };
  }

  if (impressions > 500 && clicks < 5) {
    return {
      recommendation: 'Проверить релевантность',
      wbAction: 'Почистить запросы и минус-фразы',
    };
  }

  return {
    recommendation: 'Наблюдать',
    wbAction: 'Без изменений',
  };
};

export const buildTelegramDigest = (items: Array<{ keyword: string; recommendation: string; wbAction: string }>) => {
  if (!items.length) return 'Реклама WB: значимых изменений не найдено.';
  const lines = items.slice(0, 10).map((i, idx) => `${idx + 1}) ${i.keyword}\n— ${i.recommendation}\n— ${i.wbAction}`);
  return `Реклама WB — dry-run рекомендации:\n\n${lines.join('\n\n')}`;
};
