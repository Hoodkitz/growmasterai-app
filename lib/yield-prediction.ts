/**
 * Yield Prediction Algorithm
 * Estimate harvest amount based on various factors
 */

export interface YieldPredictionParams {
  strain: string;
  strainType: 'indica' | 'sativa' | 'hybrid' | 'autoflower';
  vegWeeks: number;
  flowerWeeks: number;
  lightWattage: number;
  plantCount: number;
  growMethod: 'soil' | 'hydro' | 'coco';
  training: 'none' | 'lst' | 'topping' | 'scrog' | 'sog';
  potSize: 'small' | 'medium' | 'large'; // Liters: <10, 10-20, >20
  experience: 'beginner' | 'intermediate' | 'advanced';
  environment: 'indoor' | 'outdoor' | 'greenhouse';
}

export interface YieldPrediction {
  estimated: number; // grams
  min: number;
  max: number;
  confidence: number; // 0-100
  factors: YieldFactor[];
}

export interface YieldFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // percentage impact
  description: string;
}

/**
 * Base yield calculations by strain type
 */
const BASE_YIELDS = {
  indica: 50,
  sativa: 45,
  hybrid: 50,
  autoflower: 30,
};

/**
 * Predict yield based on multiple factors
 */
export function predictYield(params: YieldPredictionParams): YieldPrediction {
  let baseYield = BASE_YIELDS[params.strainType];
  const factors: YieldFactor[] = [];

  // 1. Vegetative Time Impact
  const vegBonus = Math.min(params.vegWeeks * 5, 30); // Max 30g bonus
  baseYield += vegBonus;
  factors.push({
    name: 'Vegetative Time',
    impact: 'positive',
    magnitude: (vegBonus / baseYield) * 100,
    description: `${params.vegWeeks} weeks veg adds ${vegBonus}g`,
  });

  // 2. Light Efficiency (watts per plant)
  const wattsPerPlant = params.lightWattage / params.plantCount;
  let lightMultiplier = 1.0;

  if (wattsPerPlant >= 300) {
    lightMultiplier = 1.3; // Excellent light
    factors.push({
      name: 'Light Power',
      impact: 'positive',
      magnitude: 30,
      description: 'High wattage per plant (300W+)',
    });
  } else if (wattsPerPlant >= 200) {
    lightMultiplier = 1.15; // Good light
    factors.push({
      name: 'Light Power',
      impact: 'positive',
      magnitude: 15,
      description: 'Good wattage per plant (200-300W)',
    });
  } else if (wattsPerPlant >= 100) {
    lightMultiplier = 1.0; // Adequate
  } else {
    lightMultiplier = 0.7; // Insufficient
    factors.push({
      name: 'Light Power',
      impact: 'negative',
      magnitude: -30,
      description: 'Low wattage per plant (<100W)',
    });
  }

  baseYield *= lightMultiplier;

  // 3. Training Method Impact
  const trainingBonus = {
    none: 0,
    lst: 15,
    topping: 20,
    scrog: 35,
    sog: 30,
  }[params.training];

  baseYield += trainingBonus;
  if (trainingBonus > 0) {
    factors.push({
      name: 'Training Method',
      impact: 'positive',
      magnitude: trainingBonus,
      description: `${params.training.toUpperCase()} training adds ${trainingBonus}g`,
    });
  }

  // 4. Grow Method Impact
  const growMethodMultiplier = {
    soil: 1.0,
    hydro: 1.25, // 25% boost
    coco: 1.15, // 15% boost
  }[params.growMethod];

  if (growMethodMultiplier > 1.0) {
    factors.push({
      name: 'Grow Method',
      impact: 'positive',
      magnitude: (growMethodMultiplier - 1) * 100,
      description: `${params.growMethod} growing increases yield`,
    });
  }

  baseYield *= growMethodMultiplier;

  // 5. Pot Size Impact
  const potMultiplier = {
    small: 0.8,
    medium: 1.0,
    large: 1.2,
  }[params.potSize];

  if (potMultiplier !== 1.0) {
    factors.push({
      name: 'Pot Size',
      impact: potMultiplier > 1 ? 'positive' : 'negative',
      magnitude: (potMultiplier - 1) * 100,
      description: `${params.potSize} pot affects root development`,
    });
  }

  baseYield *= potMultiplier;

  // 6. Experience Level Impact
  const experienceMultiplier = {
    beginner: 0.7, // 30% reduction
    intermediate: 0.9, // 10% reduction
    advanced: 1.0,
  }[params.experience];

  if (experienceMultiplier < 1.0) {
    factors.push({
      name: 'Experience',
      impact: 'negative',
      magnitude: (1 - experienceMultiplier) * 100,
      description: 'Learning curve affects yield',
    });
  }

  baseYield *= experienceMultiplier;

  // 7. Environment Impact
  const environmentMultiplier = {
    indoor: 1.0,
    outdoor: 1.5, // Sunlight advantage
    greenhouse: 1.3,
  }[params.environment];

  if (environmentMultiplier > 1.0) {
    factors.push({
      name: 'Environment',
      impact: 'positive',
      magnitude: (environmentMultiplier - 1) * 100,
      description: `${params.environment} environment benefits`,
    });
  }

  baseYield *= environmentMultiplier;

  // Calculate confidence based on data completeness
  let confidence = 70; // Base confidence
  if (params.vegWeeks > 0 && params.flowerWeeks > 0) confidence += 10;
  if (params.lightWattage > 0) confidence += 10;
  if (params.training !== 'none') confidence += 5;
  if (params.experience === 'advanced') confidence += 5;

  // Calculate range (±30%)
  const estimated = Math.round(baseYield);
  const min = Math.round(estimated * 0.7);
  const max = Math.round(estimated * 1.3);

  return {
    estimated,
    min,
    max,
    confidence: Math.min(confidence, 95), // Cap at 95%
    factors,
  };
}

/**
 * Historical yield tracking for accuracy improvement
 */
export interface HistoricalYield {
  predicted: number;
  actual: number;
  difference: number;
  accuracy: number; // percentage
  params: YieldPredictionParams;
}

export function trackYieldAccuracy(
  predicted: number,
  actual: number,
  params: YieldPredictionParams
): HistoricalYield {
  const difference = actual - predicted;
  const accuracy = 100 - Math.abs((difference / actual) * 100);

  return {
    predicted,
    actual,
    difference,
    accuracy: Math.max(0, accuracy),
    params,
  };
}

/**
 * Adjust predictions based on historical data
 */
export function improveWithHistory(
  prediction: YieldPrediction,
  history: HistoricalYield[]
): YieldPrediction {
  if (history.length === 0) return prediction;

  // Calculate average accuracy
  const avgAccuracy = history.reduce((sum, h) => sum + h.accuracy, 0) / history.length;

  // Adjust confidence based on historical accuracy
  const adjustedConfidence = Math.round((prediction.confidence + avgAccuracy) / 2);

  return {
    ...prediction,
    confidence: adjustedConfidence,
  };
}
