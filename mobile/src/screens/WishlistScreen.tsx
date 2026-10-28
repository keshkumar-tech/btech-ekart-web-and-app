import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { wishlistService } from "@/services";
import { Button, Price } from "@/components/ui";
import { mediaUrl } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useWishlist, useCart } from "@/hooks/useShop";
import { colors, font, radius, spacing } from "@/theme";
import { shareProduct } from "@/lib/share";
import type { Product } from "@/types";

export default function WishlistScreen({ navigation }: any) {
  const { isAuthenticated } = useAuth();
  const { toggleWishlist } = useWishlist();
  // Moving to the cart is also an account action.
  const { addToCart } = useCart();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header title="My Wishlist" onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Please log in first</Text>
          <Text style={styles.emptySub}>
            Your wishlist is saved to your account. Log in to view and save
            products.
          </Text>
          <Button
            title="Log in"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: spacing(5), paddingHorizontal: spacing(8) }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistService.get,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header title="My Wishlist" onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Save your favourites</Text>
          <Text style={styles.emptySub}>
            Log in to keep your wishlist synced across devices.
          </Text>
          <Button
            title="Log In"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: spacing(5) }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // The wishlist endpoint returns { products: [...] } (not a plain array).
  const items: Product[] = data?.products ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header
        title={`My Wishlist${items.length ? ` (${items.length})` : ""}`}
        onBack={() => navigation.goBack()}
      />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Tap the heart on any product to save it here.
          </Text>
          <Button
            title="Browse Products"
            onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
            style={{ marginTop: spacing(5) }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: mediaUrl(item.cover_image) }}
                style={styles.thumb}
              />
              <View style={styles.info}>
                <Text numberOfLines={2} style={styles.title}>
                  {item.title}
                </Text>
                <Text style={styles.subject}>{item.subject_code}</Text>
                <Price
                  price={item.price}
                  mrp={item.mrp}
                  discount={item.discount}
                />
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => addToCart(item)}
                    style={styles.moveBtn}
                    disabled={false}
                  >
                    <Ionicons
                      name="cart-outline"
                      size={18}
                      color={colors.brand}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => shareProduct(item)}
                    style={styles.removeBtn}
                    hitSlop={8}
                    accessibilityLabel="Share product"
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={18}
                      color={colors.brand}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => toggleWishlist(item)}
                    style={styles.removeBtn}
                    hitSlop={8}
                    accessibilityLabel="Remove from wishlist"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBack}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 34 }} />
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
  list: { padding: spacing(4), gap: spacing(3) },
  card: {
    flexDirection: "row",
    gap: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(3),
  },
  thumb: {
    width: 80,
    height: 104,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  info: { flex: 1, gap: spacing(1) },
  title: { fontSize: font.body, fontWeight: "700", color: colors.text },
  subject: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginBottom: spacing(1),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    marginTop: spacing(2),
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  moveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
  },
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
