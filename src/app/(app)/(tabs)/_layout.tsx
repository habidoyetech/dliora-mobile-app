import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { Brand, Font, type ThemeColors } from '@/constants/theme';
import { useDashboard } from '@/hooks/use-dashboard';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Filled when you're on the tab, outlined when you aren't. */
function icon(filled: IconName, outline: IconName) {
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
  }
  TabIcon.displayName = `TabIcon(${outline})`;

  return TabIcon;
}

export default function TabsLayout() {
  const theme = useTheme();
  const dashboard = useDashboard();
  const unread = dashboard.data?.notifications.unread ?? 0;

  return (
    <Tabs screenOptions={tabOptions(theme)}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen
        name="bootcamp"
        options={{ title: 'Bootcamp', tabBarIcon: icon('school', 'school-outline') }}
      />
      <Tabs.Screen
        name="assignments"
        options={{ title: 'Assignments', tabBarIcon: icon('clipboard', 'clipboard-outline') }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: icon('chatbubbles', 'chatbubbles-outline'),
          tabBarBadge: unread || undefined,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}

const tabOptions = (t: ThemeColors) => ({
  headerShown: false,
  sceneStyle: { backgroundColor: t.background },
  tabBarActiveTintColor: Brand.gold,
  tabBarInactiveTintColor: t.textMuted,
  tabBarStyle: {
    backgroundColor: t.surface,
    borderTopColor: t.border,
  },
  tabBarLabelStyle: { fontFamily: Font.medium, fontSize: 11 },
  tabBarBadgeStyle: { backgroundColor: t.danger, fontFamily: Font.semibold, fontSize: 11 },
});
