import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * 18+ confirmation. The app is for adults only (Play target group, cannabis topic), so the main
 * flow stays locked until the user confirms once. This is a self declaration, not an ID check.
 */
export const AGE_CONFIRMED_KEY = "@growmaster_age_18_confirmed";

export async function hasConfirmedAge(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AGE_CONFIRMED_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function confirmAge(): Promise<void> {
  try {
    await AsyncStorage.setItem(AGE_CONFIRMED_KEY, "true");
  } catch {
    // Storage unavailable: the gate shows again next start, which is the safe direction.
  }
}
