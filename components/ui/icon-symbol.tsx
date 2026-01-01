// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const MAPPING: Record<string, MaterialIconName> = {
  // Navigation
  "house.fill": "home",
  "camera.fill": "photo-camera",
  "message.fill": "chat",
  "leaf.fill": "eco",
  "book.fill": "menu-book",
  
  // Actions
  "paperplane.fill": "send",
  "plus.circle.fill": "add-circle",
  "xmark.circle.fill": "cancel",
  "checkmark.circle.fill": "check-circle",
  "arrow.up.circle.fill": "arrow-circle-up",
  "arrow.down.circle.fill": "arrow-circle-down",
  
  // UI Elements
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "gear": "settings",
  "photo.fill": "photo-library",
  "exclamationmark.triangle.fill": "warning",
  
  // Community & Social
  "person.fill": "person",
  "person.2.fill": "people",
  "person.3.fill": "groups",
  "heart.fill": "favorite",
  "star.fill": "star",
  "trophy.fill": "emoji-events",
  "crown.fill": "workspace-premium",
  "flame.fill": "local-fire-department",
  
  // Marketplace & Commerce
  "cart.fill": "shopping-cart",
  "bag.fill": "shopping-bag",
  "tag.fill": "local-offer",
  "gift.fill": "card-giftcard",
  "dollarsign.circle.fill": "attach-money",
  "creditcard.fill": "credit-card",
  "hammer.fill": "gavel",
  
  // Content
  "doc.fill": "description",
  "folder.fill": "folder",
  "link": "link",
  "bell.fill": "notifications",
  "bell.badge.fill": "notifications-active",
  
  // Media
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "video.fill": "videocam",
  "mic.fill": "mic",
  "speaker.wave.2.fill": "volume-up",
  
  // Status & Info
  "info.circle.fill": "info",
  "questionmark.circle.fill": "help",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  
  // Time & Calendar
  "clock.fill": "schedule",
  "calendar": "calendar-today",
  "timer": "timer",
  
  // Location
  "location.fill": "location-on",
  "map.fill": "map",
  
  // Misc
  "sparkles": "auto-awesome",
  "bolt.fill": "bolt",
  "scissors": "content-cut",
  "chart.bar.fill": "bar-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "arrow.triangle.2.circlepath": "sync",
  "qrcode": "qr-code",
  "magnifyingglass": "search",
  "slider.horizontal.3": "tune",
  "paintbrush.fill": "brush",
  "wand.and.stars": "auto-fix-high",
  
  // Live Camera
  "viewfinder": "crop-free",
  "target": "gps-fixed",
  "scope": "center-focus-strong",
};

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
