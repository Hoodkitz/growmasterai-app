/**
 * Screen-Spezifische Skeleton-Loader
 * Verwende diese Komponenten anstelle von generischen LoadingState,
 * um den Ladezustand an das jeweilige Screen-Layout anzupassen.
 */

import { View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Einzelne Skeleton-Zeile mit animiertem Pulseffekt */
function SkeletonLine({ className }: SkeletonProps) {
  const colors = useColors();
  return (
    <View
      className={cn("rounded-full bg-border animate-pulse", className)}
      style={{ backgroundColor: colors.border }}
    />
  );
}

/** Skeleton für die Home-Screen (Dashboard) */
export function HomeSkeletonLoader() {
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Header-Skeleton */}
      <View className="flex-row items-center justify-between">
        <View className="gap-2">
          <SkeletonLine className="h-8 w-40" />
          <SkeletonLine className="h-4 w-28" />
        </View>
        <View className="h-10 w-10 rounded-full bg-border/50 animate-pulse" />
      </View>

      {/* Tasks-Skeleton */}
      <View className="rounded-xl bg-surface border border-border p-4 gap-3">
        <SkeletonLine className="h-5 w-32" />
        <View className="gap-2">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="h-4 w-4 rounded-full bg-border/50 animate-pulse" />
              <SkeletonLine
                className={cn("h-4", i === 3 ? "w-3/4" : "flex-1")}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions Skeleton */}
      <View className="rounded-xl bg-surface border border-border p-4 gap-3">
        <SkeletonLine className="h-5 w-36" />
        <View className="flex-row gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-1 items-center gap-2">
              <View className="h-12 w-12 rounded-xl bg-border/50 animate-pulse" />
              <SkeletonLine className="h-3 w-16" />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Plants Skeleton */}
      <View className="rounded-xl bg-surface border border-border p-4 gap-3">
        <SkeletonLine className="h-5 w-28" />
        <View className="flex-row gap-3">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-1 gap-2">
              <View className="aspect-square rounded-lg bg-border/50 animate-pulse" />
              <SkeletonLine className="h-3 w-full" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Skeleton für die Plants-Screen */
export function PlantsSkeletonLoader() {
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <SkeletonLine className="h-8 w-32" />
        <View className="h-9 w-9 rounded-full bg-border/50 animate-pulse" />
      </View>

      {/* Filter-Skeleton */}
      <View className="flex-row gap-2">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="h-8 w-20 rounded-full bg-border/50 animate-pulse"
          />
        ))}
      </View>

      {/* Plant Cards Skeleton */}
      <View className="flex-row flex-wrap gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            className="w-[48%] rounded-xl bg-surface border border-border overflow-hidden"
          >
            <View className="aspect-[3/4] bg-border/50 animate-pulse" />
            <View className="p-3 gap-2">
              <SkeletonLine className="h-4 w-3/4" />
              <SkeletonLine className="h-3 w-1/2" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton für die Diagnose-Screen */
export function DiagnoseSkeletonLoader() {
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Header */}
      <View className="gap-2">
        <SkeletonLine className="h-8 w-40" />
        <SkeletonLine className="h-4 w-64" />
      </View>

      {/* Upload Area Skeleton */}
      <View className="rounded-xl border-2 border-dashed border-border bg-surface p-8 items-center gap-4">
        <View className="h-20 w-20 rounded-full bg-border/50 animate-pulse" />
        <SkeletonLine className="h-5 w-48" />
        <SkeletonLine className="h-4 w-32" />
      </View>

      {/* Diagnosis Results Skeleton */}
      <View className="rounded-xl bg-surface border border-border p-4 gap-3">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded-full bg-border/50 animate-pulse" />
          <SkeletonLine className="h-5 w-32" />
        </View>
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-5/6" />
        <SkeletonLine className="h-4 w-4/6" />
      </View>

      {/* Recommendations Skeleton */}
      <View className="rounded-xl bg-surface border border-border p-4 gap-3">
        <SkeletonLine className="h-5 w-36" />
        <View className="gap-2">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-start gap-2">
              <View className="h-4 w-4 rounded-full bg-border/50 animate-pulse mt-0.5" />
              <SkeletonLine
                className={cn("h-4", i === 3 ? "w-2/3" : "flex-1")}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Skeleton für die Coach-Screen */
export function CoachSkeletonLoader() {
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 rounded-full bg-border/50 animate-pulse" />
        <View className="flex-1 gap-2">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-4 w-48" />
        </View>
      </View>

      {/* Chat Messages Skeleton */}
      <View className="flex-1 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className={cn(
              "flex-row gap-2",
              i % 2 === 0 ? "justify-end" : "justify-start",
            )}
          >
            <View
              className={cn(
                "rounded-2xl p-3 max-w-[80%] gap-2",
                i % 2 === 0
                  ? "bg-primary/10"
                  : "bg-surface border border-border",
              )}
            >
              <SkeletonLine
                className={cn("h-4", i % 2 === 0 ? "w-32" : "w-48")}
              />
              <SkeletonLine className="h-4 w-24" />
            </View>
          </View>
        ))}
      </View>

      {/* Input Area Skeleton */}
      <View className="flex-row items-center gap-2">
        <View className="flex-1 h-12 rounded-xl bg-surface border border-border" />
        <View className="h-12 w-12 rounded-xl bg-primary/20 animate-pulse" />
      </View>
    </View>
  );
}

/** Skeleton für die Community-Screen */
export function CommunitySkeletonLoader() {
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <SkeletonLine className="h-8 w-36" />
        <View className="h-9 w-9 rounded-full bg-border/50 animate-pulse" />
      </View>

      {/* Tabs Skeleton */}
      <View className="flex-row gap-2">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="h-8 w-24 rounded-full bg-border/50 animate-pulse"
          />
        ))}
      </View>

      {/* Posts Skeleton */}
      <View className="gap-4">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="rounded-xl bg-surface border border-border overflow-hidden"
          >
            <View className="p-4 gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-full bg-border/50 animate-pulse" />
                <View className="flex-1 gap-2">
                  <SkeletonLine className="h-4 w-24" />
                  <SkeletonLine className="h-3 w-16" />
                </View>
              </View>
              <SkeletonLine className="h-4 w-full" />
              <SkeletonLine className="h-4 w-3/4" />
            </View>
            <View className="aspect-video bg-border/50 animate-pulse" />
            <View className="p-4 flex-row gap-4">
              {[1, 2, 3].map((j) => (
                <View key={j} className="flex-row items-center gap-1">
                  <View className="h-4 w-4 rounded bg-border/50 animate-pulse" />
                  <SkeletonLine className="h-3 w-8" />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton für die Journal-Screen */
export function JournalSkeletonLoader() {
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <SkeletonLine className="h-8 w-32" />
        <View className="h-9 w-9 rounded-full bg-border/50 animate-pulse" />
      </View>

      {/* Stats Skeleton */}
      <View className="flex-row gap-3">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 rounded-xl bg-surface border border-border p-3 gap-2"
          >
            <SkeletonLine className="h-3 w-16" />
            <SkeletonLine className="h-6 w-12" />
          </View>
        ))}
      </View>

      {/* Journal Entries Skeleton */}
      <View className="gap-3">
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className="rounded-xl bg-surface border border-border p-4 gap-3"
          >
            <View className="flex-row items-center justify-between">
              <SkeletonLine className="h-5 w-32" />
              <SkeletonLine className="h-3 w-16" />
            </View>
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-2/3" />
            <View className="flex-row gap-2">
              {[1, 2].map((j) => (
                <View
                  key={j}
                  className="h-6 w-16 rounded-full bg-border/50 animate-pulse"
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
