import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { cartService } from "@/services";
import DrawerMenu from "@/components/DrawerMenu";
import { Button, Price, Thumb } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/hooks/useShop";
import { formatINR } from "@/lib/utils";
import { shareProduct } from "@/lib/share";
import { colors, font, radius, spacing } from "@/theme";

export default function CartScreen({ navigation }: any) {
  const { isAuthenticated } = useAuth();
  const { updateQty, removeItem, count } = useCart();
  const qc = useQueryClient();
  const [drawer, setDrawer] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.get,
    enabled: isAuthenticated,
  });

  const clearCart = async () => {
    Alert.alert("Clear cart?", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            const next = await cartService.clear();
            qc.setQueryData(["cart"], next);
            Toast.show({ type: "success", text1: "Cart cleared" });
          } catch {
            Toast.show({ type: "error", text1: "Could not clear the cart" });
          }
        },
      },
    ]);
  };

  // Share one item, or the whole cart if pressed in the header.
  const shareItem = async (item: any) => {
    await shareProduct(item.product);
  };

  const shareCart = async (cartItems: any[], total: number) => {
    if (!cartItems.length) return;
    const lines = cartItems
      .map((i) => `• ${i.product.title} ×${i.quantity}`)
      .join("\n");
    try {
      await Share.share({
        message: `My B.Tech eKart cart\n\n${lines}\n\nTotal: ${formatINR(
          total,
        )}\n\nGet AKTU notes, PYQs and quantums instantly on B.Tech eKart.`,
        title: "My B.Tech eKart cart",
      });
    } catch {
      // user dismissed the sheet
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} />
        <Empty
          icon="lock-closed-outline"
          title="Please log in first"
          subtitle="Your cart is saved to your account so it syncs across devices."
          actionLabel="Log in to continue"
          onAction={() => navigation.navigate("Login")}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const items = cart?.items ?? [];
  const cartSubtotal = Number(cart?.subtotal ?? 0);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} />
        <Empty
          icon="cart-outline"
          title="Your cart is empty"
          subtitle="Add study material to your cart to continue."
          actionLabel="Browse products"
          onAction={() => navigation.navigate("Tabs", { screen: "Shop" })}
        />
      </SafeAreaView>
    );
  }

  const subtotal = Number(cart?.subtotal ?? 0);
  const savings = Number(cart?.you_save ?? cart?.savings ?? 0);
  const mrpTotal = Number(cart?.mrp_total ?? subtotal + savings);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.headerBack}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Cart ({count})</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => shareCart(items, cartSubtotal)}
            hitSlop={10}
            style={styles.headerBack}
            accessibilityLabel="Share cart"
          >
            <Ionicons name="share-social-outline" size={21} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => setDrawer(true)} hitSlop={10} style={styles.headerBack}>
            <Ionicons name="menu-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.topBar}>
        <Text style={styles.topBarText}>
          Digital items — delivered instantly after payment.
        </Text>
        <Pressable style={styles.clearBtn} onPress={clearCart} hitSlop={6}>
          <Ionicons name="trash-outline" size={13} color={colors.danger} />
          <Text style={styles.clearText}>Clear cart</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              onPress={() =>
                navigation.navigate("ProductDetail", {
                  slug: item.product.slug,
                })
              }
            >
              <Thumb uri={item.product.cover_image} w={72} />
            </Pressable>
            <View style={styles.info}>
              <Text
                numberOfLines={2}
                style={styles.title}
                onPress={() =>
                  navigation.navigate("ProductDetail", {
                    slug: item.product.slug,
                  })
                }
              >
                {item.product.title}
              </Text>
              <Text style={styles.subject}>{item.product.subject_code}</Text>
              <Price
                price={Number(item.product.price)}
                mrp={Number(item.product.mrp)}
                discount={item.product.discount}
              />
              <View style={styles.qtyRow}>
                <QtyButton
                  icon="remove"
                  onPress={() =>
                    updateQty({ itemId: item.id, quantity: item.quantity - 1 })
                  }
                  disabled={item.quantity <= 1}
                />
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <QtyButton
                  icon="add"
                  onPress={() =>
                    updateQty({ itemId: item.id, quantity: item.quantity + 1 })
                  }
                />
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.id)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.danger}
                  />
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
                <Pressable
                  style={styles.shareBtn}
                  onPress={() => shareItem(item)}
                  hitSlop={8}
                  accessibilityLabel={`Share ${item.product.title}`}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color={colors.brand}
                  />
                  <Text style={styles.shareText}>Share</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Price details</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price ({count} items)</Text>
          <Text style={styles.summaryValue}>₹{mrpTotal.toFixed(2)}</Text>
        </View>
        {savings > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              −₹{savings.toFixed(2)}
            </Text>
          </View>
        ) : null}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total amount</Text>
          <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        {savings > 0 ? (
          <View style={styles.saveBanner}>
            <Ionicons name="pricetag" size={13} color={colors.success} />
            <Text style={styles.saveBannerText}>
              You save ₹{savings.toFixed(2)} on this order
            </Text>
          </View>
        ) : null}
        <Button
          title="Proceed to Checkout"
          onPress={() => navigation.navigate("Checkout")}
          style={{ marginTop: spacing(3) }}
        />
        <Pressable
          onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
          style={styles.continueBtn}
        >
          <Text style={styles.continueText}>Continue shopping</Text>
        </Pressable>
      </View>

      {drawer ? (
        <DrawerMenu navigation={navigation} onClose={() => setDrawer(false)} />
      ) : null}
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBack}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>My Cart</Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

function QtyButton({
  icon,
  onPress,
  disabled,
}: {
  icon: "add" | "remove";
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.qtyBtn, disabled && { opacity: 0.4 }]}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
    </Pressable>
  );
}

function Empty({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon} size={64} color={colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      <Button
        title={actionLabel}
        onPress={onAction}
        style={{ marginTop: spacing(5), paddingHorizontal: spacing(8) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing(4), gap: spacing(3), paddingBottom: spacing(4) },
  card: {
    flexDirection: "row",
    gap: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(3),
  },
  thumb: {
    width: 72,
  },
  info: { flex: 1, gap: spacing(1) },
  title: { fontSize: font.body, fontWeight: "700", color: colors.text },
  subject: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginBottom: spacing(1),
  },
  qtyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing(2),
    marginTop: spacing(2),
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    marginLeft: "auto",
  },
  removeText: { color: colors.danger, fontSize: font.small, fontWeight: "600" },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
  },
  shareText: { color: colors.brand, fontSize: font.small, fontWeight: "600" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  summary: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing(5),
    paddingBottom: spacing(7),
  },
  summaryTitle: {
    fontSize: font.body,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing(3),
  },
  saveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: "#e6f9ee",
    borderRadius: radius.md,
    padding: spacing(2.5),
    marginTop: spacing(2),
  },
  saveBannerText: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.success,
  },
  continueBtn: {
    marginTop: spacing(2),
    paddingVertical: spacing(2.5),
    alignItems: "center",
  },
  continueText: { fontSize: font.small, fontWeight: "600", color: colors.textMuted },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
  },
  topBarText: { flex: 1, fontSize: font.tiny, color: colors.textMuted },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  clearText: { fontSize: font.tiny, fontWeight: "700", color: colors.danger },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing(2),
  },
  summaryLabel: { fontSize: font.body, color: colors.textMuted },
  summaryValue: { fontSize: font.body, fontWeight: "600", color: colors.text },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(3),
    marginTop: spacing(2),
  },
  totalLabel: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  totalValue: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(8),
  },
  emptyTitle: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(5),
  },
  emptySub: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(2),
  },
});
