// Home — the mobile equivalent of the web home page: banner slider, search with
// live suggestions, category tiles, "shop by category" chips, the branch banner,
// Trending / New arrivals / Combo packs / Top rated rows, blog highlights, trust
// badges, the verified-reviews row + FAQ, and the footer block.
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { blogService, catalogService, reviewsService } from "@/services";
import ProductCard from "@/components/ProductCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import DrawerMenu from "@/components/DrawerMenu";
import FooterBlock from "@/components/FooterBlock";
import { FaqRow, SectionTitle } from "@/components/content";
import { Loading } from "@/components/ui";
import { useCart, useWishlist } from "@/hooks/useShop";
import { useAuth } from "@/store/auth";
import { mediaUrl } from "@/lib/api";
import { HOME_FAQS } from "@/lib/content";
import { requireLogin } from "@/lib/authGate";
import { colors, font, radius, shadow, spacing } from "@/theme";
import type { Product } from "@/types";

const { width } = Dimensions.get("window");

const TILES = [
  {
    label: "Notes",
    type: "notes",
    icon: "book-outline" as const,
    color: "#0ea5e9",
  },
  {
    label: "PYQs",
    type: "pyq",
    icon: "reader-outline" as const,
    color: "#7c3aed",
  },
  {
    label: "Quantums",
    type: "quantum",
    icon: "flash-outline" as const,
    color: "#f59e0b",
  },
  {
    label: "Syllabus",
    type: "syllabus",
    icon: "clipboard-outline" as const,
    color: "#10b981",
  },
  {
    label: "Combos",
    type: "combo",
    icon: "cube-outline" as const,
    color: "#f43f5e",
  },
];

const BRANCHES = ["CSE", "IT", "ECE", "ME", "CE", "EE"];

// Bottom clearance so the last card is never hidden behind the absolutely
// positioned tab bar.
const TAB_BAR_INSET = 130;

const TRUST = [
  {
    icon: "flash-outline" as const,
    title: "Instant Delivery",
    text: "Download right after payment",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Secure Payments",
    text: "Razorpay & UPI supported",
  },
  {
    icon: "headset-outline" as const,
    title: "24×7 Support",
    text: "Chat on WhatsApp/Telegram",
  },
  {
    icon: "pricetag-outline" as const,
    title: "Best Prices",
    text: "Up to 70% off MRP",
  },
];

export default function HomeScreen({ navigation }: any) {
  const { addToCart, inCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);

  /* ------------------------------------------------- live search suggestions */
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const suggestions = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: () => catalogService.products({ q: debounced, page_size: 6 }),
    enabled: debounced.length >= 2,
  });

  /* ------------------------------------------------------------------ queries */
  const banners = useQuery({
    queryKey: ["banners"],
    queryFn: catalogService.banners,
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.categories,
  });

  // NOTE: the API expects snake_case params from the web (is_trending,
  // is_new_arrival). `branch` is NOT a valid param — it is branch__short_name.
  const trending = useQuery({
    queryKey: ["home-trending"],
    queryFn: () =>
      catalogService.products({
        is_trending: true,
        ordering: "-sold_count",
        page_size: 10,
      }),
  });
  const newArrivals = useQuery({
    queryKey: ["home-new"],
    queryFn: () =>
      catalogService.products({
        is_new_arrival: true,
        ordering: "-created_at",
        page_size: 10,
      }),
  });
  const combos = useQuery({
    queryKey: ["home-combos"],
    queryFn: () => catalogService.products({ type: "combo", page_size: 10 }),
  });
  const topRated = useQuery({
    queryKey: ["home-toprated"],
    queryFn: () =>
      catalogService.products({ ordering: "-rating", page_size: 10 }),
  });
  const posts = useQuery({
    queryKey: ["home-blog"],
    queryFn: () => blogService.posts({ page_size: 3 }),
  });
  const reviews = useQuery({
    queryKey: ["home-reviews"],
    queryFn: () => reviewsService.publicList(20),
  });

  const onRefresh = () => {
    banners.refetch();
    categories.refetch();
    trending.refetch();
    newArrivals.refetch();
    combos.refetch();
    topRated.refetch();
    posts.refetch();
    reviews.refetch();
  };
  const refreshing =
    banners.isFetching || trending.isFetching || newArrivals.isFetching;

  const goShop = (params: Record<string, unknown>) =>
    navigation.navigate("Shop", { ...params, _ts: Date.now() });

  // Guests never get a local cart/wishlist — they are asked to log in.
  const handleAdd = (p: Product) => {
    if (!requireLogin(navigation, isAuthenticated, "add to cart")) return;
    addToCart(p);
  };
  const handleWishlist = (p: Product) => {
    if (!requireLogin(navigation, isAuthenticated, "save to wishlist")) return;
    toggleWishlist(p);
  };
  const goToCart = () => navigation.navigate("Cart");

  const reviewItems = useMemo(
    () => (reviews.data ?? []).filter((r) => r.comment?.trim()).slice(0, 8),
    [reviews.data],
  );
  const reviewAvg =
    reviewItems.length > 0
      ? (
          reviewItems.reduce((s, r) => s + r.rating, 0) / reviewItems.length
        ).toFixed(1)
      : null;

  const showSuggestions =
    searchFocused &&
    debounced.length >= 2 &&
    (suggestions.data?.results?.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setDrawer(true)}
          hitSlop={10}
          style={styles.menuBtn}
        >
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.brand}>
          B.Tech <Text style={styles.brandAccent}>eKart</Text>
        </Text>
        <View style={styles.headerIcons}>
          <Pressable
            onPress={() => navigation.navigate("Notifications")}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Wishlist")}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons name="heart-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Cart")}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons name="cart-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search with live suggestions */}
        <View style={{ zIndex: 20 }}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes, PYQs, subjects, codes…"
              placeholderTextColor={colors.textLight}
              value={q}
              onChangeText={setQ}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onSubmitEditing={() => {
                setSearchFocused(false);
                if (q.trim()) goShop({ q: q.trim() });
              }}
              returnKeyType="search"
            />
            {q ? (
              <Pressable onPress={() => setQ("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textLight}
                />
              </Pressable>
            ) : null}
          </View>

          {showSuggestions ? (
            <View style={styles.suggestBox}>
              {suggestions.data!.results.slice(0, 6).map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.suggestRow}
                  onPress={() => {
                    setSearchFocused(false);
                    navigation.navigate("ProductDetail", { slug: p.slug });
                  }}
                >
                  <Image
                    source={{ uri: mediaUrl(p.cover_image) }}
                    style={styles.suggestThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.suggestTitle}>
                      {p.title}
                    </Text>
                    <Text style={styles.suggestCode}>{p.subject_code}</Text>
                  </View>
                  <Text style={styles.suggestPrice}>
                    ₹{Number(p.price).toFixed(0)}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.suggestAll}
                onPress={() => {
                  setSearchFocused(false);
                  goShop({ q: debounced });
                }}
              >
                <Text style={styles.suggestAllText}>
                  See all results for “{debounced}”
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Banner slider — ScrollView pager (a pagingEnabled FlatList throws
            "Property 'HorizontalScroll' doesn't exist" on RN 0.74), wrapped in
            a fixed-width box so it cannot stretch the parent ScrollView. */}
        {banners.data && banners.data.length > 0 ? (
          <View style={{ width }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ width, flexGrow: 0 }}
              contentContainerStyle={{ alignItems: "stretch" }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setBannerIdx(
                  Math.max(0, Math.min(idx, banners.data!.length - 1)),
                );
              }}
            >
              {banners.data.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.bannerSlide}
                  onPress={() => goShop({})}
                >
                  <View style={styles.banner}>
                    {item.image ? (
                      <Image
                        source={{ uri: mediaUrl(item.image) }}
                        style={styles.bannerImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.bannerFallback}>
                        <Text style={styles.heroPill}>
                          ● AKTU STUDY MATERIAL
                        </Text>
                      </View>
                    )}
                    <View style={styles.bannerOverlay}>
                      {item.badge_text ? (
                        <View style={styles.bannerBadge}>
                          <Text style={styles.bannerBadgeText}>
                            {item.badge_text}
                          </Text>
                        </View>
                      ) : null}
                      {item.title ? (
                        <Text numberOfLines={1} style={styles.bannerTitle}>
                          {item.title}
                        </Text>
                      ) : null}
                      {item.subtitle ? (
                        <Text numberOfLines={1} style={styles.bannerSub}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            {banners.data.length > 1 ? (
              <View style={styles.dots}>
                {banners.data.map((b, i) => (
                  <View
                    key={b.id}
                    style={[styles.dot, i === bannerIdx && styles.dotActive]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.heroFallback}>
            <Text style={styles.heroPill}>● INSTANT DOWNLOAD · AKTU</Text>
            <Text style={styles.heroTitle}>
              Every semester. <Text style={styles.heroAccent}>One cart.</Text>
            </Text>
            <Text style={styles.heroBody}>
              Notes, PYQs, Quantums, Syllabus and Combos for all AKTU branches —
              verified by toppers, delivered the second you pay.
            </Text>
            <View style={styles.heroActions}>
              <Pressable style={styles.heroBtn} onPress={() => goShop({})}>
                <Text style={styles.heroBtnText}>Shop now</Text>
              </Pressable>
              <Pressable
                style={styles.heroBtnGhost}
                onPress={() => goShop({ type: "combo" })}
              >
                <Text style={styles.heroBtnGhostText}>Explore combos</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Category tiles */}
        <View style={styles.tiles}>
          {TILES.map((t) => (
            <Pressable
              key={t.type}
              style={styles.tile}
              onPress={() => goShop({ type: t.type })}
            >
              <View
                style={[styles.tileIcon, { backgroundColor: `${t.color}1a` }]}
              >
                <Ionicons name={t.icon} size={22} color={t.color} />
              </View>
              <Text style={styles.tileLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Shop by category (server-driven) */}
        {categories.data && categories.data.length > 0 ? (
          <View style={{ marginTop: spacing(5) }}>
            <SectionTitle
              title="Shop by Category"
              subtitle="Everything you need, organised the way you study"
              onAction={() => goShop({})}
              actionLabel="View all"
            />
            <HorizontalScroll
              data={categories.data}
              keyExtractor={(c) => String(c.id)}
              gap={spacing(2.5)}
              // SectionTitle already supplies the 16px side padding, so the
              // scroller must not add it again (that pushed the last chip
              // off the right edge).
              horizontalPadding={0}
              renderItem={(item) => (
                <Pressable
                  style={styles.catChip}
                  onPress={() => goShop({ category: item.slug })}
                >
                  <Text style={styles.catChipText}>{item.name}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={12}
                    color={colors.brand}
                  />
                </Pressable>
              )}
            />
          </View>
        ) : null}

        {/* Branch banner */}
        <View style={styles.branchBanner}>
          <View style={styles.branchBlob} />
          <Text style={styles.branchPill}>⚡ PICK YOUR BRANCH</Text>
          <Text style={styles.branchTitle}>Find material for your branch</Text>
          <Text style={styles.branchBody}>
            Select your branch and jump straight to relevant subjects.
          </Text>
          <View style={styles.branchWrap}>
            {BRANCHES.map((b) => (
              <Pressable
                key={b}
                style={styles.branchBtn}
                onPress={() => goShop({ branch: b })}
              >
                <Text style={styles.branchBtnText}>{b}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Product rows */}
        <ProductRow
          title="🔥 Trending Now"
          subtitle="Most popular among AKTU students"
          onSeeAll={() => goShop({ is_trending: true })}
          loading={trending.isLoading}
          products={trending.data?.results ?? []}
          navigation={navigation}
          onAdd={handleAdd}
          onToggleWishlist={handleWishlist}
          isWishlisted={isWishlisted}
          inCart={inCart}
          onGoToCart={goToCart}
        />

        <ProductRow
          title="🆕 New Arrivals"
          subtitle="Freshly added study material"
          onSeeAll={() => goShop({ is_new_arrival: true })}
          loading={newArrivals.isLoading}
          products={newArrivals.data?.results ?? []}
          navigation={navigation}
          onAdd={handleAdd}
          onToggleWishlist={handleWishlist}
          isWishlisted={isWishlisted}
          inCart={inCart}
          onGoToCart={goToCart}
        />

        <ProductRow
          title="🎯 Combo Packs"
          subtitle="Notes + PYQ + Quantum bundled — best value"
          onSeeAll={() => goShop({ type: "combo" })}
          loading={combos.isLoading}
          products={combos.data?.results ?? []}
          navigation={navigation}
          onAdd={handleAdd}
          onToggleWishlist={handleWishlist}
          isWishlisted={isWishlisted}
          inCart={inCart}
          onGoToCart={goToCart}
        />

        <ProductRow
          title="⭐ Top Rated"
          subtitle="Highest-rated by verified buyers"
          onSeeAll={() => goShop({ ordering: "-rating" })}
          loading={topRated.isLoading}
          products={topRated.data?.results ?? []}
          navigation={navigation}
          onAdd={handleAdd}
          onToggleWishlist={handleWishlist}
          isWishlisted={isWishlisted}
          inCart={inCart}
          onGoToCart={goToCart}
        />

        {/* Blog highlights */}
        {posts.data?.results?.length ? (
          <View style={{ marginTop: spacing(7) }}>
            <SectionTitle
              title="📰 From the Blog"
              onAction={() => navigation.navigate("Tabs", { screen: "Blog" })}
              actionLabel="All posts"
            />
            {posts.data.results.slice(0, 3).map((p) => (
              <Pressable
                key={p.id}
                style={styles.blogCard}
                onPress={() =>
                  navigation.navigate("BlogDetail", { slug: p.slug })
                }
              >
                <Image
                  source={{ uri: mediaUrl(p.cover_image) }}
                  style={styles.blogThumb}
                />
                <View style={{ flex: 1 }}>
                  {p.category ? (
                    <Text style={styles.blogCat}>
                      {p.category.name.toUpperCase()}
                    </Text>
                  ) : null}
                  <Text numberOfLines={2} style={styles.blogTitle}>
                    {p.title}
                  </Text>
                  <Text numberOfLines={2} style={styles.blogExcerpt}>
                    {p.excerpt}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Trust badges */}
        <View style={styles.trustCard}>
          {TRUST.map((t) => (
            <View key={t.title} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <Ionicons name={t.icon} size={19} color={colors.brand} />
              </View>
              <Text style={styles.trustTitle}>{t.title}</Text>
              <Text style={styles.trustText}>{t.text}</Text>
            </View>
          ))}
        </View>

        {/* Verified reviews */}
        <View style={{ marginTop: spacing(7) }}>
          <SectionTitle
            title="💬 What students say"
            subtitle={
              reviewAvg
                ? `${reviewAvg}★ average from ${reviewItems.length} verified review${
                    reviewItems.length === 1 ? "" : "s"
                  }`
                : "Real reviews from verified buyers"
            }
          />
          {reviews.isLoading ? (
            <Loading />
          ) : reviewItems.length === 0 ? (
            <View style={styles.reviewEmpty}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={26}
                color={colors.textLight}
              />
              <Text style={styles.reviewEmptyTitle}>No reviews yet</Text>
              <Text style={styles.reviewEmptyText}>
                Reviews from verified buyers show up here automatically once
                they're approved.
              </Text>
            </View>
          ) : (
            <HorizontalScroll
              data={reviewItems}
              keyExtractor={(r) => String(r.id)}
              renderItem={(item) => (
                <View style={styles.reviewCard}>
                  <View style={styles.starsRow}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Ionicons
                        key={i}
                        name={i < item.rating ? "star" : "star-outline"}
                        size={12}
                        color={colors.accent}
                      />
                    ))}
                    <Text style={styles.reviewRating}>{item.rating}.0</Text>
                  </View>
                  <Text numberOfLines={4} style={styles.reviewText}>
                    “{item.comment}”
                  </Text>
                  <View style={styles.reviewFooter}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {(item.user_name || "S").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.reviewName}>
                        {item.user_name || "Verified student"}
                        {item.is_verified_purchase ? "  ✓" : ""}
                      </Text>
                      <Text numberOfLines={1} style={styles.reviewProduct}>
                        {item.product_title || "Study material"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* FAQ */}
        <View style={{ marginTop: spacing(8) }}>
          <SectionTitle
            title="Frequently asked questions"
            subtitle="Downloads, payments, syllabus coverage and support"
          />
          <View style={{ paddingHorizontal: spacing(4) }}>
            {HOME_FAQS.map((f, i) => (
              <FaqRow key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </View>
        </View>

        {/* Footer */}
        <FooterBlock navigation={navigation} />

        {/* Signed-out hint */}
        {!isAuthenticated ? (
          <Pressable
            style={styles.loginStrip}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginStripText}>
              Log in to sync your cart, wishlist and downloads
            </Text>
            <Text style={styles.loginStripCta}>Log in →</Text>
          </Pressable>
        ) : null}

        <View style={{ height: TAB_BAR_INSET }} />
      </ScrollView>

      {drawer ? (
        <DrawerMenu navigation={navigation} onClose={() => setDrawer(false)} />
      ) : null}
    </SafeAreaView>
  );
}

function ProductRow({
  title,
  subtitle,
  onSeeAll,
  loading,
  products,
  navigation,
  onAdd,
  onToggleWishlist,
  isWishlisted,
  inCart,
  onGoToCart,
}: {
  title: string;
  subtitle: string;
  onSeeAll: () => void;
  loading: boolean;
  products: Product[];
  navigation: any;
  onAdd: (p: Product) => void;
  onToggleWishlist: (p: Product) => void;
  isWishlisted: (id: number) => boolean;
  inCart: (id: number) => boolean;
  onGoToCart: () => void;
}) {
  return (
    <View style={{ marginTop: spacing(7) }}>
      <SectionTitle
        title={title}
        subtitle={subtitle}
        onAction={onSeeAll}
        actionLabel="See all"
      />
      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <Text style={styles.rowEmpty}>
          New material is added regularly — check back soon.
        </Text>
      ) : (
        <HorizontalScroll
          data={products.slice(0, 10)}
          keyExtractor={(p) => String(p.id)}
          renderItem={(item) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate("ProductDetail", { slug: item.slug })
              }
              onAdd={() => onAdd(item)}
              onToggleWishlist={() => onToggleWishlist(item)}
              wishlisted={isWishlisted(item.id)}
              inCart={inCart(item.id)}
              onGoToCart={onGoToCart}
            />
          )}
        />
      )}
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
    paddingVertical: spacing(2.5),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing(2),
  },
  menuBtn: { padding: spacing(1.5) },
  brand: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.5,
  },
  brandAccent: { color: colors.accentDark },
  headerIcons: { flexDirection: "row", gap: spacing(0.5) },
  iconBtn: { padding: spacing(1.5) },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    marginHorizontal: spacing(4),
    marginTop: spacing(3),
    marginBottom: spacing(3),
    paddingHorizontal: spacing(4),
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing(2.75),
    fontSize: font.body,
    color: colors.text,
  },
  suggestBox: {
    position: "absolute",
    left: spacing(4),
    right: spacing(4),
    top: spacing(15),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing(1),
    ...shadow.card,
    elevation: 6,
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  suggestThumb: {
    width: 30,
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.bg,
  },
  suggestTitle: { fontSize: font.small, fontWeight: "600", color: colors.text },
  suggestCode: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
  suggestPrice: {
    fontSize: font.small,
    fontWeight: "800",
    color: colors.brand,
  },
  suggestAll: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing(2.5),
    alignItems: "center",
  },
  suggestAllText: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.brand,
  },
  bannerSlide: {
    width,
    paddingHorizontal: spacing(4),
  },
  banner: {
    height: 150,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#0b1120",
    ...shadow.card,
  },
  bannerFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing(1),
    marginTop: spacing(2),
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: { width: 18, backgroundColor: colors.brand },
  bannerImg: { width: "100%", height: "100%" },
  bannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing(4),
    backgroundColor: "rgba(7,11,22,0.62)",
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    marginBottom: spacing(1.5),
  },
  bannerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
  },
  bannerTitle: { color: colors.white, fontSize: font.h3, fontWeight: "800" },
  bannerSub: { color: "#cbd5e1", fontSize: font.tiny, marginTop: 2 },
  heroFallback: {
    marginHorizontal: spacing(4),
    backgroundColor: "#0b1120",
    borderRadius: radius.lg,
    padding: spacing(5),
  },
  heroPill: {
    color: "#a5b4fc",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: font.h1,
    fontWeight: "800",
    marginTop: spacing(3),
    lineHeight: 32,
  },
  heroAccent: { color: "#a5b4fc" },
  heroBody: {
    color: "#94a3b8",
    fontSize: font.small,
    lineHeight: 19,
    marginTop: spacing(2),
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing(2.5),
    marginTop: spacing(4),
  },
  heroBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
  },
  heroBtnText: { color: colors.white, fontWeight: "700", fontSize: font.small },
  heroBtnGhost: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
  },
  heroBtnGhostText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: font.small,
  },
  tiles: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    marginTop: spacing(4),
  },
  tile: { alignItems: "center", gap: spacing(1.5) },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontSize: font.tiny, fontWeight: "600", color: colors.text },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3.5),
    // A chip needs a fixed line-height so the pill never clips its text.
    height: 36,
    paddingTop: 0,
    paddingBottom: 0,
  },
  catChipText: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
    includeFontPadding: false,
  },
  branchBanner: {
    marginHorizontal: spacing(4),
    marginTop: spacing(6),
    backgroundColor: "#0b1120",
    borderRadius: radius.xl,
    padding: spacing(5),
    overflow: "hidden",
  },
  branchBlob: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(99,102,241,0.3)",
    top: -70,
    right: -40,
  },
  branchPill: {
    color: "#a5b4fc",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  branchTitle: {
    color: colors.white,
    fontSize: font.h2,
    fontWeight: "800",
    marginTop: spacing(2.5),
  },
  branchBody: {
    color: "#94a3b8",
    fontSize: font.small,
    marginTop: spacing(1.5),
  },
  branchWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    marginTop: spacing(4),
  },
  branchBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
  },
  branchBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: font.small,
  },
  blogCard: {
    flexDirection: "row",
    gap: spacing(3),
    marginHorizontal: spacing(4),
    marginBottom: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  blogThumb: { width: 96, height: 96, backgroundColor: colors.brandLight },
  blogCat: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 0.6,
    marginTop: spacing(2.5),
  },
  blogTitle: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
    paddingRight: spacing(3),
  },
  blogExcerpt: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: 2,
    paddingRight: spacing(3),
    marginBottom: spacing(2),
  },
  trustCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: spacing(4),
    marginTop: spacing(8),
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing(4),
    ...shadow.card,
  },
  trustItem: {
    width: "50%",
    alignItems: "center",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(2),
    textAlign: "center",
  },
  trustText: {
    fontSize: font.tiny,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 15,
  },
  reviewEmpty: {
    alignItems: "center",
    marginHorizontal: spacing(4),
    paddingVertical: spacing(6),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  reviewEmptyTitle: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(2),
  },
  reviewEmptyText: {
    fontSize: font.tiny,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(1),
    paddingHorizontal: spacing(6),
  },
  reviewCard: {
    width: 250,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  reviewRating: {
    fontSize: font.tiny,
    fontWeight: "700",
    color: colors.textLight,
    marginLeft: spacing(1),
  },
  reviewText: {
    fontSize: font.small,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: spacing(2.5),
    minHeight: 70,
  },
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    marginTop: spacing(3),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: font.small,
  },
  reviewName: { fontSize: font.small, fontWeight: "700", color: colors.text },
  reviewProduct: { fontSize: font.tiny, color: colors.textLight, marginTop: 1 },
  rowEmpty: {
    fontSize: font.small,
    color: colors.textMuted,
    paddingHorizontal: spacing(4),
  },
  loginStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
    marginHorizontal: spacing(4),
    marginTop: spacing(5),
    padding: spacing(4),
    borderRadius: radius.lg,
    backgroundColor: colors.brandLight,
  },
  loginStripText: {
    flex: 1,
    fontSize: font.small,
    color: colors.text,
    fontWeight: "600",
  },
  loginStripCta: {
    fontSize: font.small,
    fontWeight: "800",
    color: colors.brand,
  },
});
