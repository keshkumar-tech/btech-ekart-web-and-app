import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { useAuth } from "@/store/auth";
import { useCart } from "@/hooks/useShop";

// Auth / onboarding
import SplashScreen from "@/screens/SplashScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";

// Main
import HomeScreen from "@/screens/HomeScreen";
import ShopScreen from "@/screens/ShopScreen";
import ProductDetailScreen from "@/screens/ProductDetailScreen";
import CartScreen from "@/screens/CartScreen";
import WishlistScreen from "@/screens/WishlistScreen";
import CheckoutScreen from "@/screens/CheckoutScreen";
import OrderSuccessScreen from "@/screens/OrderSuccessScreen";
import MyOrdersScreen from "@/screens/MyOrdersScreen";
import OrderDetailScreen from "@/screens/OrderDetailScreen";
import MyLibraryScreen from "@/screens/MyLibraryScreen";
import PdfViewerScreen from "@/screens/PdfViewerScreen";
import PreviewScreen from "@/screens/PreviewScreen";
import BlogListScreen from "@/screens/BlogListScreen";
import BlogDetailScreen from "@/screens/BlogDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";

// Content / static pages (mirror the web store)
import AboutScreen from "@/screens/AboutScreen";
import ContactScreen from "@/screens/ContactScreen";
import LegalScreen from "@/screens/LegalScreen";

// Admin dashboard (mirrors the web /admin section — one screen per page)
import AdminTabs from "@/screens/admin/AdminTabs";
import AdminHomeScreen from "@/screens/admin/AdminHomeScreen";
import AdminOrdersScreen from "@/screens/admin/AdminOrdersScreen";
import AdminOrderDetailScreen from "@/screens/admin/AdminOrderDetailScreen";
import AdminCustomersScreen from "@/screens/admin/AdminCustomersScreen";
import AdminCustomerDetailScreen from "@/screens/admin/AdminCustomerDetailScreen";
import AdminProductsScreen from "@/screens/admin/AdminProductsScreen";
import AdminTaxonomyScreen from "@/screens/admin/AdminTaxonomyScreen";
import AdminCouponsScreen from "@/screens/admin/AdminCouponsScreen";
import AdminBannersScreen from "@/screens/admin/AdminBannersScreen";
import AdminReviewsScreen from "@/screens/admin/AdminReviewsScreen";
import AdminBlogScreen from "@/screens/admin/AdminBlogScreen";
import AdminSettingsScreen from "@/screens/admin/AdminSettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textLight,
        // A slightly taller bar + a small label that never truncates. The
        // previous fixed 62px height squeezed the label to "Pro…" on devices
        // with large system font scaling.
        tabBarStyle: {
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          borderTopColor: colors.border,
          backgroundColor: colors.white,
          // Keep the bar pinned above the keyboard instead of being pushed
          // off-screen while a search field is focused.
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "600",
          marginTop: -2,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarAllowFontScaling: false,
        tabBarIcon: ({ color }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Shop: "grid-outline",
            Blog: "newspaper-outline",
            Profile: "person-outline",
          };
          return (
            <Ionicons
              name={icons[route.name] ?? "ellipse-outline"}
              size={22}
              color={color}
            />
          );
        },
        tabBarBadge:
          route.name === "Profile" && isAuthenticated && itemCount > 0
            ? itemCount
            : undefined,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Blog" component={BlogListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Full-screen routes shared by signed-in and guest users.
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="MyLibrary" component={MyLibraryScreen} />
      <Stack.Screen
        name="PdfViewer"
        component={PdfViewerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />

      {/* Admin dashboard — 5 tabs, each with its own menu
          (Overview · Commerce · Content · System · Profile) */}
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Stack.Screen
        name="AdminOrderDetail"
        component={AdminOrderDetailScreen}
      />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} />
      <Stack.Screen
        name="AdminCustomerDetail"
        component={AdminCustomerDetailScreen}
      />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="AdminTaxonomy" component={AdminTaxonomyScreen} />
      <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} />
      <Stack.Screen name="AdminBanners" component={AdminBannersScreen} />
      <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Stack.Screen name="AdminBlog" component={AdminBlogScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { initialized } = useAuth();

  if (!initialized) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}
