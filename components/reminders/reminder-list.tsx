/**
 * Reminder List Component
 * Shows all reminders for a plant with quick actions
 */

import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { PlantReminder, getPlantReminders, toggleReminder, completeReminder, snoozeReminder, deleteReminder } from '@/lib/reminder-system';
import { format } from 'date-fns';

interface ReminderListProps {
  plantId: string;
  onRefresh?: () => void;
}

export function ReminderList({ plantId, onRefresh }: ReminderListProps) {
  const [reminders, setReminders] = useState<PlantReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = async () => {
    setLoading(true);
    const data = await getPlantReminders(plantId);
    setReminders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReminders();
  }, [plantId]);

  const handleToggle = async (reminderId: string) => {
    await toggleReminder(reminderId);
    await loadReminders();
    onRefresh?.();
  };

  const handleComplete = async (reminderId: string) => {
    await completeReminder(reminderId);
    await loadReminders();
    onRefresh?.();
  };

  const handleSnooze = async (reminderId: string) => {
    await snoozeReminder(reminderId, 1); // Snooze for 1 hour
    await loadReminders();
    onRefresh?.();
  };

  const handleDelete = async (reminderId: string) => {
    await deleteReminder(reminderId);
    await loadReminders();
    onRefresh?.();
  };

  const getReminderIcon = (type: PlantReminder['type']) => {
    switch (type) {
      case 'watering': return '💧';
      case 'feeding': return '🌿';
      case 'training': return '✂️';
      case 'inspection': return '🔍';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <View className="p-4">
        <Text className="text-muted">Loading reminders...</Text>
      </View>
    );
  }

  if (reminders.length === 0) {
    return (
      <View className="p-4 bg-surface rounded-xl">
        <Text className="text-muted text-center">
          No reminders set. Add one to never forget watering!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="space-y-2">
      {reminders.map((reminder) => (
        <View
          key={reminder.id}
          className="bg-surface border border-border rounded-xl p-4"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-2">{getReminderIcon(reminder.type)}</Text>
              <Text className="text-base font-semibold text-foreground flex-1">
                {reminder.title}
              </Text>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={() => handleToggle(reminder.id)}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor={reminder.enabled ? '#fff' : '#9CA3AF'}
            />
          </View>

          {/* Message */}
          <Text className="text-sm text-muted mb-2">
            {reminder.message}
          </Text>

          {/* Scheduled Time */}
          <Text className="text-xs text-muted mb-3">
            Next: {format(reminder.scheduledTime, 'MMM d, h:mm a')}
            {reminder.repeatDays && ` • Repeats every ${reminder.repeatDays} days`}
          </Text>

          {/* Quick Actions */}
          {reminder.enabled && (
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => handleComplete(reminder.id)}
                className="flex-1 bg-primary/10 border border-primary/20 rounded-lg py-2"
              >
                <Text className="text-primary text-center text-sm font-semibold">
                  ✓ Done
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSnooze(reminder.id)}
                className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-lg py-2"
              >
                <Text className="text-orange-600 text-center text-sm font-semibold">
                  ⏰ Snooze
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(reminder.id)}
                className="px-4 bg-destructive/10 border border-destructive/20 rounded-lg py-2"
              >
                <Text className="text-destructive text-center text-sm font-semibold">
                  🗑️
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
