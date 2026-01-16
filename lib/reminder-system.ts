/**
 * Auto Reminder System
 * Smart notifications for watering, feeding, and other tasks
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PlantReminder {
  id: string;
  plantId: string;
  plantName: string;
  type: 'watering' | 'feeding' | 'training' | 'inspection' | 'custom';
  title: string;
  message: string;
  scheduledTime: Date;
  repeatInterval?: 'daily' | 'weekly' | 'custom';
  repeatDays?: number; // For custom intervals
  enabled: boolean;
  notificationId?: string;
}

const REMINDERS_KEY = '@growmaster_reminders';

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false; // Web doesn't support push notifications
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Calculate next watering time based on growth stage and environment
 */
export function calculateNextWatering(
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'harvest',
  potSize: 'small' | 'medium' | 'large' = 'medium'
): number {
  // Days between watering
  const wateringSchedule = {
    seedling: { small: 2, medium: 2, large: 3 },
    vegetative: { small: 2, medium: 3, large: 4 },
    flowering: { small: 2, medium: 2, large: 3 },
    harvest: { small: 7, medium: 7, large: 7 }, // Minimal watering
  };

  return wateringSchedule[growthStage][potSize];
}

/**
 * Calculate next feeding time based on growth stage
 */
export function calculateNextFeeding(
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'harvest'
): number {
  const feedingSchedule = {
    seedling: 7, // Weekly for seedlings
    vegetative: 3, // Every 3 days
    flowering: 2, // Every 2 days
    harvest: 14, // No feeding near harvest
  };

  return feedingSchedule[growthStage];
}

/**
 * Schedule a notification
 */
export async function scheduleNotification(
  reminder: PlantReminder
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Cancel existing notification if any
    if (reminder.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    const trigger: any = {
      date: reminder.scheduledTime,
    };

    // Add repeat if specified
    if (reminder.repeatInterval === 'daily') {
      trigger.repeats = true;
      trigger.hour = reminder.scheduledTime.getHours();
      trigger.minute = reminder.scheduledTime.getMinutes();
    } else if (reminder.repeatInterval === 'weekly') {
      trigger.repeats = true;
      trigger.weekday = reminder.scheduledTime.getDay();
      trigger.hour = reminder.scheduledTime.getHours();
      trigger.minute = reminder.scheduledTime.getMinutes();
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.message,
        data: {
          reminderId: reminder.id,
          plantId: reminder.plantId,
          type: reminder.type,
        },
        sound: true,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Create automatic watering reminder for a plant
 */
export async function createWateringReminder(
  plantId: string,
  plantName: string,
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'harvest',
  preferredTime: Date = new Date()
): Promise<PlantReminder> {
  const daysUntilNextWatering = calculateNextWatering(growthStage);
  
  const scheduledTime = new Date(preferredTime);
  scheduledTime.setDate(scheduledTime.getDate() + daysUntilNextWatering);

  const reminder: PlantReminder = {
    id: `watering_${plantId}_${Date.now()}`,
    plantId,
    plantName,
    type: 'watering',
    title: `💧 Time to water ${plantName}`,
    message: `Your ${plantName} needs watering. Check soil moisture before watering.`,
    scheduledTime,
    repeatDays: daysUntilNextWatering,
    enabled: true,
  };

  const notificationId = await scheduleNotification(reminder);
  if (notificationId) {
    reminder.notificationId = notificationId;
  }

  await saveReminder(reminder);
  return reminder;
}

/**
 * Create automatic feeding reminder for a plant
 */
export async function createFeedingReminder(
  plantId: string,
  plantName: string,
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'harvest',
  preferredTime: Date = new Date()
): Promise<PlantReminder> {
  const daysUntilNextFeeding = calculateNextFeeding(growthStage);
  
  const scheduledTime = new Date(preferredTime);
  scheduledTime.setDate(scheduledTime.getDate() + daysUntilNextFeeding);

  const reminder: PlantReminder = {
    id: `feeding_${plantId}_${Date.now()}`,
    plantId,
    plantName,
    type: 'feeding',
    title: `🌿 Feed ${plantName}`,
    message: `Time to give ${plantName} nutrients. Check feeding schedule.`,
    scheduledTime,
    repeatDays: daysUntilNextFeeding,
    enabled: true,
  };

  const notificationId = await scheduleNotification(reminder);
  if (notificationId) {
    reminder.notificationId = notificationId;
  }

  await saveReminder(reminder);
  return reminder;
}

/**
 * Save reminder to storage
 */
async function saveReminder(reminder: PlantReminder): Promise<void> {
  try {
    const existingReminders = await getAllReminders();
    const updated = [...existingReminders.filter(r => r.id !== reminder.id), reminder];
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving reminder:', error);
  }
}

/**
 * Get all reminders
 */
export async function getAllReminders(): Promise<PlantReminder[]> {
  try {
    const data = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!data) return [];
    
    const reminders = JSON.parse(data);
    // Convert date strings back to Date objects
    return reminders.map((r: any) => ({
      ...r,
      scheduledTime: new Date(r.scheduledTime),
    }));
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

/**
 * Get reminders for a specific plant
 */
export async function getPlantReminders(plantId: string): Promise<PlantReminder[]> {
  const allReminders = await getAllReminders();
  return allReminders.filter(r => r.plantId === plantId);
}

/**
 * Mark reminder as completed and reschedule
 */
export async function completeReminder(reminderId: string): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (!reminder) return;

    // Cancel old notification
    if (reminder.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    // Reschedule based on repeat interval
    if (reminder.repeatDays) {
      const nextTime = new Date();
      nextTime.setDate(nextTime.getDate() + reminder.repeatDays);
      
      const updatedReminder: PlantReminder = {
        ...reminder,
        scheduledTime: nextTime,
      };

      const notificationId = await scheduleNotification(updatedReminder);
      if (notificationId) {
        updatedReminder.notificationId = notificationId;
      }

      await saveReminder(updatedReminder);
    } else {
      // One-time reminder, just remove it
      await deleteReminder(reminderId);
    }
  } catch (error) {
    console.error('Error completing reminder:', error);
  }
}

/**
 * Snooze reminder (postpone by specified hours)
 */
export async function snoozeReminder(reminderId: string, hours: number = 1): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (!reminder) return;

    // Cancel old notification
    if (reminder.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    // Reschedule for later
    const snoozedTime = new Date();
    snoozedTime.setHours(snoozedTime.getHours() + hours);

    const updatedReminder: PlantReminder = {
      ...reminder,
      scheduledTime: snoozedTime,
    };

    const notificationId = await scheduleNotification(updatedReminder);
    if (notificationId) {
      updatedReminder.notificationId = notificationId;
    }

    await saveReminder(updatedReminder);
  } catch (error) {
    console.error('Error snoozing reminder:', error);
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(reminderId: string): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    const updated = reminders.filter(r => r.id !== reminderId);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting reminder:', error);
  }
}

/**
 * Toggle reminder on/off
 */
export async function toggleReminder(reminderId: string): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (!reminder) return;

    if (reminder.enabled) {
      // Disable: cancel notification
      if (reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      }
      reminder.enabled = false;
      reminder.notificationId = undefined;
    } else {
      // Enable: schedule notification
      const notificationId = await scheduleNotification(reminder);
      reminder.enabled = true;
      reminder.notificationId = notificationId || undefined;
    }

    await saveReminder(reminder);
  } catch (error) {
    console.error('Error toggling reminder:', error);
  }
}

/**
 * Update all reminders for a plant when growth stage changes
 */
export async function updatePlantReminders(
  plantId: string,
  newGrowthStage: 'seedling' | 'vegetative' | 'flowering' | 'harvest'
): Promise<void> {
  const reminders = await getPlantReminders(plantId);
  
  for (const reminder of reminders) {
    let newDays: number;
    
    if (reminder.type === 'watering') {
      newDays = calculateNextWatering(newGrowthStage);
    } else if (reminder.type === 'feeding') {
      newDays = calculateNextFeeding(newGrowthStage);
    } else {
      continue; // Skip custom reminders
    }

    // Cancel old notification
    if (reminder.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    // Update reminder
    const nextTime = new Date();
    nextTime.setDate(nextTime.getDate() + newDays);

    const updatedReminder: PlantReminder = {
      ...reminder,
      scheduledTime: nextTime,
      repeatDays: newDays,
    };

    const notificationId = await scheduleNotification(updatedReminder);
    if (notificationId) {
      updatedReminder.notificationId = notificationId;
    }

    await saveReminder(updatedReminder);
  }
}

/**
 * Setup default reminders for a new plant
 */
export async function setupDefaultReminders(
  plantId: string,
  plantName: string,
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'harvest'
): Promise<void> {
  // Set default time to 9 AM
  const defaultTime = new Date();
  defaultTime.setHours(9, 0, 0, 0);

  await createWateringReminder(plantId, plantName, growthStage, defaultTime);
  
  // Feeding reminder at 10 AM
  const feedingTime = new Date(defaultTime);
  feedingTime.setHours(10, 0, 0, 0);
  await createFeedingReminder(plantId, plantName, growthStage, feedingTime);
}
