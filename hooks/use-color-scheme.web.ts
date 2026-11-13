import { useThemeContext } from "@/lib/theme-provider";

/**
 * Web: use the app's ThemeProvider scheme (same as native), NOT the RN-web /
 * prefers-color-scheme value. Otherwise inline colors from useColors() (e.g.
 * chip text) follow the system theme while the app background follows the
 * ThemeProvider (default: dark), giving dark text on dark background when the
 * system is in light mode.
 */
export function useColorScheme() {
  return useThemeContext().colorScheme;
}
