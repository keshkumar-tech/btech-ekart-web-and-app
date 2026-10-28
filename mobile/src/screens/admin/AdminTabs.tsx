// Bottom navigation for the mobile admin dashboard.
//
// 5 sections only, exactly like the brief:
//   Overview · Commerce · Content · System · Profile
//
// Each tab opens a screen with that section's menu (the same items the web
// /admin sidebar has, plus the admin profile items). Tapping a menu pushes the
// real feature screen (AdminOrders, AdminProducts, …) on the stack.
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import AdminOverviewTab from "@/screens/admin/tabs/AdminOverviewTab";
import AdminCommerceTab from "@/screens/admin/tabs/AdminCommerceTab";
import AdminContentTab from "@/screens/admin/tabs/AdminContentTab";
import AdminSystemTab from "@/screens/admin/tabs/AdminSystemTab";
import AdminProfileTab from "@/screens/admin/tabs/AdminProfileTab";
import { useTheme } from "@/store/theme";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Overview: "speedometer-outline",
  Commerce: "bag-handle-outline",
  Content: "albums-outline",
  System: "settings-outline",
  Profile: "person-circle-outline",
};

export default function AdminTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        tabBarAllowFontScaling: false,
        tabBarIcon: ({ color }) => (
          <Ionicons
            name={ICONS[route.name] ?? "ellipse-outline"}
            size={22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Overview" component={AdminOverviewTab} />
      <Tab.Screen name="Commerce" component={AdminCommerceTab} />
      <Tab.Screen name="Content" component={AdminContentTab} />
      <Tab.Screen name="System" component={AdminSystemTab} />
      <Tab.Screen name="Profile" component={AdminProfileTab} />
    </Tab.Navigator>
  );
}
