export const projectEvidence = {
  dataset: {
    totalRecords: 29068,
    uniqueStocks: 1000,
    totalReadCount: 7970407,
    totalCommentCount: 598667,
    windowStart: '2026-05-01',
    windowEnd: '2026-05-21',
  },
  model: {
    featureCount: 52,
    bestCvAuc: 0.6014,
    cvAccuracy: 0.7182,
    cvF1: 0.502,
    mergedSamples: 4494,
  },
  featuredPrediction: {
    direction: '上涨',
    confidence: 0.6316,
    riskScore: 0.5164,
    expectedRange: '+2.9% ~ +8.8%',
  },
} as const;
