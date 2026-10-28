// Slide-in side menu — the mobile equivalent of the web navbar + footer.
// Contains: main links, Shop-by-type, Shop-by-branch, Shop-by-semester,
// account links, company pages, policies and support channels.
import React from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { openLink } from "@/components/content";
import { useAuth } from "@/store/auth";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  TELEGRAM_LINK,
  WHATSAPP_LINK,
} from "@/lib/content";
import { colors, font, radius, spacing } from "@/theme";

const BRANCHES = [
  { short: "CSE", name: "Computer Science" },
  { short: "IT", name: "Information Tech" },
  { short: "ECE", name: "Electronics" },
  { short: "ME", name: "Mechanical" },
  { short: "CE", name: "Civil" },
  { short: "EE", name: "Electrical" },
];

const TYPES = [
  { type: "notes", label: "Notes", desc: "Complete subject notes" },
  { type: "pyq", label: "PYQs", desc: "Solved papers 2018–2024" },
  { type: "quantum", label: "Quantums", desc: "Most repeated questions" },
  { type: "syllabus", label: "Syllabus", desc: "Latest AKTU PDFs" },
  { type: "combo", label: "Combos", desc: "Best value bundles" },
];

const POLICIES = [
  { page: "terms", label: "Terms & Conditions", icon: "document-text-outline" },
  { page: "privacy", label: "Privacy Policy", icon: "lock-closed-outline" },
  { page: "refund", label: "Refund Policy", icon: "refresh-outline" },
  {
    page: "disclaimer",
    label: "Disclaimer",
    icon: "information-circle-outline",
  },
];

const { width } = Dimensions.get("window");
const DRAWER_W = Math.min(320, width * 0.86);

export default function DrawerMenu({ navigation, onClose }: any) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const slide = React.useRef(new Animated.Value(-DRAWER_W)).current;

  React.useEffect(() => {
    Animated.timing(slide, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [slide]);

  const close = () => {
    Animated.timing(slide, {
      toValue: -DRAWER_W,
      duration: 180,
      useNativeDriver: true,
    }).start(onClose);
  };

  // Tapping a row: close the drawer, then navigate on the next frame so the
  // stack screen is not pushed underneath a still-animating overlay.
  const go = (screen: string, params?: Record<string, unknown>) => {
    close();
    setTimeout(() => navigation.navigate(screen, params), 190);
  };

  const goShop = (params: Record<string, unknown>) =>
    go("Shop", { ...params, _ts: Date.now() });

  const signOut = async () => {
    close();
    await logout();
    setTimeout(() => navigation.navigate("Tabs"), 200);
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={close} />
      <Animated.View
        style={[
          styles.sheet,
          { width: DRAWER_W, transform: [{ translateX: slide }] },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing(8) }}
          >
            {/* Brand + account */}
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>e</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brand}>
                  B.Tech <Text style={styles.brandAccent}>eKart</Text>
                </Text>
                <Text style={styles.brandSub}>AKTU STUDY STORE</Text>
              </View>
              <Pressable onPress={close} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Pressable
              style={styles.account}
              onPress={() => (isAuthenticated ? go("Profile") : go("Login"))}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {isAuthenticated
                    ? (user?.name?.charAt(0)?.toUpperCase() ?? "U")
                    : "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>
                  {isAuthenticated ? user?.name : "Guest user"}
                </Text>
                <Text numberOfLines={1} style={styles.accountEmail}>
                  {isAuthenticated
                    ? user?.email
                    : "Tap to log in and sync your cart"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textLight}
              />
            </Pressable>

            {/* Main */}
            <Group title="Browse">
              <Row
                icon="home-outline"
                label="Home"
                onPress={() => go("Tabs", { screen: "Home" })}
              />
              <Row
                icon="grid-outline"
                label="All Products"
                onPress={() => goShop({})}
              />
              <Row
                icon="newspaper-outline"
                label="Blog"
                onPress={() => go("Tabs", { screen: "Blog" })}
              />
              <Row
                icon="information-circle-outline"
                label="About us"
                onPress={() => go("About")}
              />
              <Row
                icon="headset-outline"
                label="Contact & support"
                onPress={() => go("Contact")}
              />
            </Group>

            <Group title="Shop by type">
              {TYPES.map((t) => (
                <Row
                  key={t.type}
                  icon="pricetag-outline"
                  label={t.label}
                  hint={t.desc}
                  onPress={() => goShop({ type: t.type })}
                />
              ))}
            </Group>

            <Group title="Shop by branch">
              <View style={styles.chipWrap}>
                {BRANCHES.map((b) => (
                  <Pressable
                    key={b.short}
                    style={styles.branchChip}
                    onPress={() => goShop({ branch: b.short })}
                  >
                    <Text style={styles.branchShort}>{b.short}</Text>
                    <Text numberOfLines={1} style={styles.branchName}>
                      {b.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Group>

            <Group title="Shop by semester">
              <View style={styles.chipWrap}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <Pressable
                    key={s}
                    style={styles.semChip}
                    onPress={() => goShop({ semester: s })}
                  >
                    <Text style={styles.semChipText}>Sem {s}</Text>
                  </Pressable>
                ))}
              </View>
            </Group>

            {isAuthenticated ? (
              <Group title="My account">
                <Row
                  icon="person-outline"
                  label="My profile"
                  onPress={() => go("Profile")}
                />
                <Row
                  icon="receipt-outline"
                  label="My orders"
                  onPress={() => go("MyOrders")}
                />
                <Row
                  icon="library-outline"
                  label="My library"
                  onPress={() => go("MyLibrary")}
                />
                <Row
                  icon="heart-outline"
                  label="My wishlist"
                  onPress={() => go("Wishlist")}
                />
                <Row
                  icon="cart-outline"
                  label="My cart"
                  onPress={() => go("Cart")}
                />
                <Row
                  icon="notifications-outline"
                  label="Notifications"
                  onPress={() => go("Notifications")}
                />
                {isAdmin ? (
                  <Row
                    icon="shield-checkmark-outline"
                    label="Admin dashboard"
                    hint="Manage orders, products, customers…"
                    onPress={() => go("AdminTabs")}
                  />
                ) : null}
              </Group>
            ) : null}

            <Group title="Policies">
              {POLICIES.map((p) => (
                <Row
                  key={p.page}
                  icon={p.icon as keyof typeof Ionicons.glyphMap}
                  label={p.label}
                  onPress={() => go("Legal", { page: p.page })}
                />
              ))}
            </Group>

            <Group title="Support">
              <Row
                icon="logo-whatsapp"
                label="WhatsApp"
                hint="Usually replies in minutes"
                onPress={() => openLink(WHATSAPP_LINK)}
              />
              <Row
                icon="paper-plane-outline"
                label="Telegram"
                hint="New material & offer alerts"
                onPress={() => openLink(TELEGRAM_LINK)}
              />
              <Row
                icon="mail-outline"
                label={SUPPORT_EMAIL}
                onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
              />
              <Row
                icon="call-outline"
                label={SUPPORT_PHONE}
                hint="Mon–Sat, 10am – 7pm IST"
                onPress={() => openLink("tel:+919999999999")}
              />
            </Group>

            {isAuthenticated ? (
              <Pressable style={styles.logout} onPress={signOut}>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={styles.logoutText}>Log out</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.loginBtn} onPress={() => go("Login")}>
                <Text style={styles.loginText}>Log in / Create account</Text>
              </Pressable>
            )}

            <Text style={styles.version}>B.Tech eKart v1.0.0</Text>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={19} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheet: {
    backgroundColor: colors.white,
    height: "100%",
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: "hidden",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
    paddingBottom: spacing(2),
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontWeight: "900", fontSize: 20 },
  brand: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  brandAccent: { color: colors.brand },
  brandSub: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: colors.textLight,
    fontWeight: "800",
    marginTop: 1,
  },
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    marginHorizontal: spacing(4),
    marginTop: spacing(2),
    padding: spacing(3),
    borderRadius: radius.lg,
    backgroundColor: colors.brandLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: font.h3 },
  accountName: { fontSize: font.body, fontWeight: "700", color: colors.text },
  accountEmail: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: 1,
  },
  group: { marginTop: spacing(4), paddingHorizontal: spacing(2) },
  groupTitle: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: colors.textLight,
    paddingHorizontal: spacing(3),
    marginBottom: spacing(1.5),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    borderRadius: radius.md,
  },
  rowLabel: { fontSize: font.body, fontWeight: "600", color: colors.text },
  rowHint: { fontSize: font.tiny, color: colors.textLight, marginTop: 1 },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    paddingHorizontal: spacing(3),
  },
  branchChip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(2),
  },
  branchShort: {
    fontSize: font.tiny,
    fontWeight: "800",
    color: colors.brand,
  },
  branchName: { flex: 1, fontSize: font.tiny, color: colors.textMuted },
  semChip: {
    minWidth: 58,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(2),
  },
  semChipText: { fontSize: font.tiny, fontWeight: "700", color: colors.text },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    marginHorizontal: spacing(5),
    marginTop: spacing(6),
    paddingVertical: spacing(3),
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: radius.md,
  },
  logoutText: { color: colors.danger, fontWeight: "700", fontSize: font.body },
  loginBtn: {
    marginHorizontal: spacing(5),
    marginTop: spacing(6),
    paddingVertical: spacing(3.5),
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
  },
  loginText: { color: colors.white, fontWeight: "800", fontSize: font.body },
  version: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: font.tiny,
    marginTop: spacing(6),
  },
});
