/**
 * Yield Predictor Component
 * Predict harvest amount with AI
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { predictYield, YieldPredictionParams } from '@/lib/yield-prediction';

export function YieldPredictor() {
  const [params, setParams] = useState<YieldPredictionParams>({
    strain: '',
    strainType: 'hybrid',
    vegWeeks: 4,
    flowerWeeks: 8,
    lightWattage: 300,
    plantCount: 1,
    growMethod: 'soil',
    training: 'none',
    potSize: 'medium',
    experience: 'beginner',
    environment: 'indoor',
  });

  const [prediction, setPrediction] = useState<ReturnType<typeof predictYield> | null>(null);

  const handlePredict = () => {
    const result = predictYield(params);
    setPrediction(result);
  };

  return (
    <ScrollView className="flex-1">
      <View className="p-6">
        <Text className="text-2xl font-bold text-foreground mb-2">
          🔮 Yield Prediction
        </Text>
        <Text className="text-base text-muted mb-6">
          Estimate your harvest based on grow parameters
        </Text>

        {/* Strain Type */}
        <Text className="text-sm font-semibold text-foreground mb-2">Strain Type</Text>
        <View className="flex-row flex-wrap mb-4">
          {(['indica', 'sativa', 'hybrid', 'autoflower'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setParams({ ...params, strainType: type })}
              className={`mr-2 mb-2 px-4 py-2 rounded-lg ${params.strainType === type ? 'bg-primary' : 'bg-border'}`}
            >
              <Text className={`capitalize ${params.strainType === type ? 'text-white' : 'text-foreground'}`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grow Time */}
        <View className="flex-row space-x-2 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground mb-2">Veg Weeks</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setParams({ ...params, vegWeeks: Math.max(0, params.vegWeeks - 1) })}
                className="bg-border rounded-lg p-3"
              >
                <Text className="text-foreground text-lg font-bold">-</Text>
              </TouchableOpacity>
              <Text className="flex-1 text-center text-xl font-bold text-foreground">
                {params.vegWeeks}
              </Text>
              <TouchableOpacity
                onPress={() => setParams({ ...params, vegWeeks: params.vegWeeks + 1 })}
                className="bg-border rounded-lg p-3"
              >
                <Text className="text-foreground text-lg font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground mb-2">Flower Weeks</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setParams({ ...params, flowerWeeks: Math.max(0, params.flowerWeeks - 1) })}
                className="bg-border rounded-lg p-3"
              >
                <Text className="text-foreground text-lg font-bold">-</Text>
              </TouchableOpacity>
              <Text className="flex-1 text-center text-xl font-bold text-foreground">
                {params.flowerWeeks}
              </Text>
              <TouchableOpacity
                onPress={() => setParams({ ...params, flowerWeeks: params.flowerWeeks + 1 })}
                className="bg-border rounded-lg p-3"
              >
                <Text className="text-foreground text-lg font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Light Wattage */}
        <Text className="text-sm font-semibold text-foreground mb-2">Light Wattage</Text>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => setParams({ ...params, lightWattage: Math.max(0, params.lightWattage - 50) })}
            className="bg-border rounded-lg p-3"
          >
            <Text className="text-foreground text-lg font-bold">-</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-foreground">
            {params.lightWattage}W
          </Text>
          <TouchableOpacity
            onPress={() => setParams({ ...params, lightWattage: params.lightWattage + 50 })}
            className="bg-border rounded-lg p-3"
          >
            <Text className="text-foreground text-lg font-bold">+</Text>
          </TouchableOpacity>
        </View>

        {/* Training Method */}
        <Text className="text-sm font-semibold text-foreground mb-2">Training Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {(['none', 'lst', 'topping', 'scrog', 'sog'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setParams({ ...params, training: method })}
              className={`mr-2 px-4 py-2 rounded-lg ${params.training === method ? 'bg-primary' : 'bg-border'}`}
            >
              <Text className={`uppercase ${params.training === method ? 'text-white' : 'text-foreground'}`}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Experience Level */}
        <Text className="text-sm font-semibold text-foreground mb-2">Your Experience</Text>
        <View className="flex-row flex-wrap mb-6">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setParams({ ...params, experience: level })}
              className={`mr-2 mb-2 px-4 py-2 rounded-lg ${params.experience === level ? 'bg-primary' : 'bg-border'}`}
            >
              <Text className={`capitalize ${params.experience === level ? 'text-white' : 'text-foreground'}`}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Predict Button */}
        <TouchableOpacity
          onPress={handlePredict}
          className="bg-primary rounded-xl py-4 mb-6 shadow-lg"
        >
          <Text className="text-white text-center text-lg font-bold">
            Calculate Prediction
          </Text>
        </TouchableOpacity>

        {/* Prediction Results */}
        {prediction && (
          <View className="bg-gradient-to-br from-primary/10 to-green-500/10 border-2 border-primary rounded-xl p-6">
            <Text className="text-center text-base text-muted mb-2">Estimated Yield</Text>
            <Text className="text-center text-5xl font-bold text-primary mb-2">
              {prediction.estimated}g
            </Text>
            <Text className="text-center text-sm text-muted mb-4">
              Range: {prediction.min}g - {prediction.max}g
            </Text>
            <Text className="text-center text-xs text-muted mb-6">
              Confidence: {prediction.confidence}%
            </Text>

            {/* Factors */}
            <Text className="text-base font-bold text-foreground mb-3">Impact Factors:</Text>
            {prediction.factors.map((factor, index) => (
              <View key={index} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">{factor.name}</Text>
                  <Text className={`text-sm font-semibold ${factor.impact === 'positive' ? 'text-green-600' : factor.impact === 'negative' ? 'text-red-600' : 'text-muted'}`}>
                    {factor.impact === 'positive' ? '+' : ''}{factor.magnitude.toFixed(0)}%
                  </Text>
                </View>
                <Text className="text-xs text-muted">{factor.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
