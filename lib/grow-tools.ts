// Grow Tools - Kalender, Rechner und Timer

export interface MoonPhase {
  name: string;
  emoji: string;
  description: string;
  growTip: string;
  percentage: number;
}

export const getMoonPhase = (date: Date = new Date()): MoonPhase => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Simplified moon phase calculation
  const c = Math.floor(year / 100);
  const n = year - 19 * Math.floor(year / 19);
  const k = Math.floor((c - 17) / 25);
  let i = c - Math.floor(c / 4) - Math.floor((c - k) / 3) + 19 * n + 15;
  i = i - 30 * Math.floor(i / 30);
  i = i - Math.floor(i / 28) * (1 - Math.floor(i / 28) * Math.floor(29 / (i + 1)) * Math.floor((21 - n) / 11));
  let j = year + Math.floor(year / 4) + i + 2 - c + Math.floor(c / 4);
  j = j - 7 * Math.floor(j / 7);
  const l = i - j;
  const moonMonth = 3 + Math.floor((l + 40) / 44);
  const moonDay = l + 28 - 31 * Math.floor(moonMonth / 4);
  
  const lunarDay = ((day + moonDay) % 30);
  const percentage = Math.round((lunarDay / 29.5) * 100);
  
  if (lunarDay < 1.85) return { name: "Neumond", emoji: "🌑", description: "Keine sichtbare Beleuchtung", growTip: "Ideal für Wurzelarbeiten und Umpflanzen", percentage };
  if (lunarDay < 7.38) return { name: "Zunehmende Sichel", emoji: "🌒", description: "Rechte Seite beleuchtet", growTip: "Gute Zeit für Aussaat und Stecklinge", percentage };
  if (lunarDay < 11.07) return { name: "Erstes Viertel", emoji: "🌓", description: "Rechte Hälfte beleuchtet", growTip: "Optimale Zeit für oberirdisches Wachstum", percentage };
  if (lunarDay < 14.77) return { name: "Zunehmender Mond", emoji: "🌔", description: "Fast vollständig beleuchtet", growTip: "Beste Zeit für Blattdüngung", percentage };
  if (lunarDay < 18.46) return { name: "Vollmond", emoji: "🌕", description: "Vollständig beleuchtet", growTip: "Höchste Saftaktivität - ideal für Ernte", percentage };
  if (lunarDay < 22.15) return { name: "Abnehmender Mond", emoji: "🌖", description: "Linke Seite beginnt zu verdunkeln", growTip: "Gute Zeit für Beschneiden", percentage };
  if (lunarDay < 25.84) return { name: "Letztes Viertel", emoji: "🌗", description: "Linke Hälfte beleuchtet", growTip: "Ideal für Wurzelarbeiten", percentage };
  return { name: "Abnehmende Sichel", emoji: "🌘", description: "Fast vollständig verdunkelt", growTip: "Ruhezeit - minimale Eingriffe", percentage };
};

// VPD (Vapor Pressure Deficit) Calculator
export interface VPDResult {
  vpd: number;
  status: "low" | "optimal" | "high";
  recommendation: string;
  leafVPD: number;
}

export const calculateVPD = (tempC: number, humidity: number, leafTempOffset: number = -2): VPDResult => {
  // Saturation vapor pressure at air temperature
  const svpAir = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  
  // Actual vapor pressure
  const avp = svpAir * (humidity / 100);
  
  // Leaf temperature (typically 1-3°C lower than air)
  const leafTemp = tempC + leafTempOffset;
  
  // Saturation vapor pressure at leaf temperature
  const svpLeaf = 0.6108 * Math.exp((17.27 * leafTemp) / (leafTemp + 237.3));
  
  // VPD calculation
  const vpd = svpLeaf - avp;
  const leafVPD = svpAir - avp;
  
  let status: "low" | "optimal" | "high";
  let recommendation: string;
  
  if (vpd < 0.4) {
    status = "low";
    recommendation = "VPD zu niedrig - Schimmelgefahr! Luftfeuchtigkeit senken oder Temperatur erhöhen.";
  } else if (vpd >= 0.4 && vpd <= 0.8) {
    status = "optimal";
    recommendation = "Optimaler VPD-Bereich für Sämlings- und Klon-Phase.";
  } else if (vpd > 0.8 && vpd <= 1.2) {
    status = "optimal";
    recommendation = "Optimaler VPD-Bereich für vegetatives Wachstum.";
  } else if (vpd > 1.2 && vpd <= 1.6) {
    status = "optimal";
    recommendation = "Optimaler VPD-Bereich für Blütephase.";
  } else {
    status = "high";
    recommendation = "VPD zu hoch - Pflanzenstress! Luftfeuchtigkeit erhöhen oder Temperatur senken.";
  }
  
  return { vpd: Math.round(vpd * 100) / 100, status, recommendation, leafVPD: Math.round(leafVPD * 100) / 100 };
};

// Nutrient Calculator
export interface NutrientMix {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  ec: number;
  ph: number;
}

export const calculateNutrients = (
  phase: "seedling" | "vegetative" | "flowering" | "late-flowering",
  waterLiters: number,
  strength: number = 100 // percentage of full strength
): NutrientMix => {
  const baseRatios: Record<string, NutrientMix> = {
    seedling: { nitrogen: 1, phosphorus: 1, potassium: 1, calcium: 0.5, magnesium: 0.3, sulfur: 0.2, ec: 0.4, ph: 6.0 },
    vegetative: { nitrogen: 3, phosphorus: 1, potassium: 2, calcium: 1, magnesium: 0.5, sulfur: 0.3, ec: 1.2, ph: 6.0 },
    flowering: { nitrogen: 1, phosphorus: 3, potassium: 3, calcium: 1.2, magnesium: 0.6, sulfur: 0.4, ec: 1.6, ph: 6.2 },
    "late-flowering": { nitrogen: 0.5, phosphorus: 2, potassium: 4, calcium: 1, magnesium: 0.5, sulfur: 0.3, ec: 1.4, ph: 6.3 },
  };
  
  const base = baseRatios[phase];
  const multiplier = (waterLiters * strength) / 100;
  
  return {
    nitrogen: Math.round(base.nitrogen * multiplier * 10) / 10,
    phosphorus: Math.round(base.phosphorus * multiplier * 10) / 10,
    potassium: Math.round(base.potassium * multiplier * 10) / 10,
    calcium: Math.round(base.calcium * multiplier * 10) / 10,
    magnesium: Math.round(base.magnesium * multiplier * 10) / 10,
    sulfur: Math.round(base.sulfur * multiplier * 10) / 10,
    ec: Math.round(base.ec * (strength / 100) * 10) / 10,
    ph: base.ph,
  };
};

// Light Schedule Calculator
export interface LightSchedule {
  phase: string;
  lightHours: number;
  darkHours: number;
  dli: number; // Daily Light Integral
  recommendation: string;
}

export const getLightSchedule = (
  phase: "seedling" | "vegetative" | "flowering" | "autoflower",
  ppfd: number = 400 // μmol/m²/s
): LightSchedule => {
  const schedules: Record<string, Omit<LightSchedule, "dli">> = {
    seedling: { phase: "Sämling", lightHours: 18, darkHours: 6, recommendation: "Sanftes Licht, 60-80cm Abstand" },
    vegetative: { phase: "Vegetativ", lightHours: 18, darkHours: 6, recommendation: "Volles Licht, 40-60cm Abstand" },
    flowering: { phase: "Blüte", lightHours: 12, darkHours: 12, recommendation: "Maximale Intensität, 30-45cm Abstand" },
    autoflower: { phase: "Autoflower", lightHours: 20, darkHours: 4, recommendation: "Konstanter Zyklus, 40-50cm Abstand" },
  };
  
  const schedule = schedules[phase];
  // DLI = PPFD × (Lichtstunden × 3600) / 1,000,000
  const dli = Math.round((ppfd * schedule.lightHours * 3600) / 1000000);
  
  return { ...schedule, dli };
};

// Drying Timer
export interface DryingStatus {
  day: number;
  expectedDays: number;
  progress: number;
  tips: string[];
  checkpoints: { day: number; action: string; completed: boolean }[];
}

export const getDryingStatus = (startDate: Date, method: "hang" | "rack" | "paper"): DryingStatus => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const day = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const expectedDays = method === "hang" ? 10 : method === "rack" ? 7 : 5;
  const progress = Math.min((day / expectedDays) * 100, 100);
  
  const tips = [
    "Temperatur: 18-22°C halten",
    "Luftfeuchtigkeit: 50-60%",
    "Gute Luftzirkulation sicherstellen",
    "Direktes Licht vermeiden",
  ];
  
  const checkpoints = [
    { day: 1, action: "Große Fächerblätter entfernen", completed: day >= 1 },
    { day: 3, action: "Stängel auf Biegsamkeit prüfen", completed: day >= 3 },
    { day: 5, action: "Äußere Blüten auf Trockenheit prüfen", completed: day >= 5 },
    { day: 7, action: "Snap-Test: Stängel sollten knacken", completed: day >= 7 },
    { day: 10, action: "Bereit für Curing wenn Stängel brechen", completed: day >= 10 },
  ];
  
  return { day, expectedDays, progress, tips, checkpoints };
};

// Cost Tracker
export interface GrowCost {
  category: string;
  items: { name: string; cost: number; date: Date }[];
  total: number;
}

export interface CostSummary {
  electricity: number;
  nutrients: number;
  equipment: number;
  seeds: number;
  other: number;
  total: number;
  costPerGram: number;
}

export const calculateCostPerGram = (totalCost: number, yieldGrams: number): number => {
  if (yieldGrams <= 0) return 0;
  return Math.round((totalCost / yieldGrams) * 100) / 100;
};

// Yield Estimator
export interface YieldEstimate {
  minGrams: number;
  maxGrams: number;
  avgGrams: number;
  factors: { name: string; impact: string }[];
}

export const estimateYield = (
  lightWatts: number,
  plantCount: number,
  experience: "beginner" | "intermediate" | "expert",
  method: "soil" | "hydro" | "coco"
): YieldEstimate => {
  // Base: 0.5-1g per watt for beginners, up to 1.5g for experts
  const experienceMultiplier = { beginner: 0.5, intermediate: 0.8, expert: 1.2 };
  const methodMultiplier = { soil: 1, coco: 1.1, hydro: 1.2 };
  
  const baseYieldPerWatt = experienceMultiplier[experience] * methodMultiplier[method];
  const minGrams = Math.round(lightWatts * baseYieldPerWatt * 0.7);
  const maxGrams = Math.round(lightWatts * baseYieldPerWatt * 1.3);
  const avgGrams = Math.round((minGrams + maxGrams) / 2);
  
  const factors = [
    { name: "Lichtleistung", impact: `${lightWatts}W = ${Math.round(lightWatts * 0.8)}-${Math.round(lightWatts * 1.2)}g Basis` },
    { name: "Erfahrung", impact: `${experience} = ${Math.round(experienceMultiplier[experience] * 100)}% Effizienz` },
    { name: "Anbaumethode", impact: `${method} = ${Math.round(methodMultiplier[method] * 100)}% Ertrag` },
    { name: "Pflanzenanzahl", impact: `${plantCount} Pflanzen` },
  ];
  
  return { minGrams, maxGrams, avgGrams, factors };
};

// Watering Calculator
export interface WateringSchedule {
  frequencyDays: number;
  amountMl: number;
  tips: string[];
}

export const calculateWatering = (
  potSizeLiters: number,
  phase: "seedling" | "vegetative" | "flowering",
  temperature: number,
  humidity: number
): WateringSchedule => {
  // Base: 10-20% of pot volume
  let baseAmount = potSizeLiters * 150; // ml
  let frequencyDays = 3;
  
  // Adjust for phase
  if (phase === "seedling") {
    baseAmount *= 0.3;
    frequencyDays = 4;
  } else if (phase === "flowering") {
    baseAmount *= 1.2;
    frequencyDays = 2;
  }
  
  // Adjust for environment
  if (temperature > 28) {
    baseAmount *= 1.2;
    frequencyDays -= 1;
  }
  if (humidity < 40) {
    baseAmount *= 1.1;
  }
  
  const tips = [
    "Finger-Test: Erde 2-3cm tief trocken = gießen",
    "Topf-Gewicht prüfen: leicht = gießen",
    "Morgens gießen für beste Aufnahme",
    "Überschüssiges Wasser ablaufen lassen",
  ];
  
  return {
    frequencyDays: Math.max(1, Math.round(frequencyDays)),
    amountMl: Math.round(baseAmount),
    tips,
  };
};
