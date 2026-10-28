// Shop — mirrors the web /shop page: search, result count, full sort list, and
// filters for type / branch / semester / year / category / price / rating.
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services";
import ProductCard from "@/components/ProductCard";
import DrawerMenu from "@/components/DrawerMenu";
import { Button, Chip } from "@/components/ui";
import { useCart, useWishlist } from "@/hooks/useShop";
import { useAuth } from "@/store/auth";
import { requireLogin } from "@/lib/authGate";
import { colors, font, radius, spacing } from "@/theme";
import type { Product } from "@/types";

const TYPES = [
  { value: "notes", label: "Notes" },
  { value: "pyq", label: "PYQ" },
  { value: "quantum", label: "Quantum" },
  { value: "syllabus", label: "Syllabus" },
  { value: "combo", label: "Combo" },
];

const SORTS = [
  { label: "Newest first", value: "-created_at" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Top rated", value: "-rating" },
  { label: "Best selling", value: "-sold_count" },
  { label: "Biggest discount", value: "-discount" },
];

const EMPTY_FILTERS = {
  type: "",
  branch: "",
  year: "",
  semester: "",
  category: "",
  min_price: "",
  max_price: "",
  rating: "",
  ordering: "-created_at",
};

function filtersFromParams(p: any): Record<string, string> {
  return {
    ...EMPTY_FILTERS,
    type: p?.type ?? "",
    branch: p?.branch ?? "",
    semester: p?.semester ? String(p.semester) : "",
    year: p?.year ? String(p.year) : "",
    category: p?.category ?? "",
    ordering: p?.ordering ?? "-created_at",
    rating: p?.rating ? String(p.rating) : "",
  };
}

export default function ShopScreen({ navigation, route }: any) {
  const { addToCart, inCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Guests are asked to log in — nothing is stored locally.
  const handleAdd = (p: Product) => {
    if (!requireLogin(navigation, isAuthenticated, "add to cart")) return;
    addToCart(p);
  };
  const handleWishlist = (p: Product) => {
    if (!requireLogin(navigation, isAuthenticated, "save to wishlist")) return;
    toggleWishlist(p);
  };
  // Exact card width: screen − horizontal padding − one gutter, split in two.
  const { width: screenW } = useWindowDimensions();
  const gridPadding = spacing(4);
  const gridGap = spacing(3);
  const cardW = Math.floor((screenW - gridPadding * 2 - gridGap) / 2);

  const [search, setSearch] = useState<string>(route?.params?.q ?? "");
  const [debounced, setDebounced] = useState<string>(route?.params?.q ?? "");
  const [filters, setFilters] = useState<Record<string, string>>(
    filtersFromParams(route?.params),
  );
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Home / Drawer deep-links re-apply whenever new params arrive. The sender
  // appends `_ts` so tapping the same link twice still resets the filters.
  useEffect(() => {
    const p = route?.params;
    if (!p) return;
    setFilters(filtersFromParams(p));
    if (typeof p.q === "string") {
      setSearch(p.q);
      setDebounced(p.q);
    } else {
      setSearch("");
      setDebounced("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?._ts]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: catalogService.branches,
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: catalogService.categories,
  });

  const params = useMemo(() => {
    const p: Record<string, any> = {
      page,
      page_size: 12,
      ordering: filters.ordering || "-created_at",
    };
    if (debounced) p.q = debounced;
    if (filters.type) p.type = filters.type;
    if (filters.branch) p.branch__short_name = filters.branch;
    if (filters.year) p.year = filters.year;
    if (filters.semester) p.semester = filters.semester;
    if (filters.category) p.category__slug = filters.category;
    if (filters.min_price) p.price__gte = filters.min_price;
    if (filters.max_price) p.price__lte = filters.max_price;
    if (filters.rating) p.rating__gte = filters.rating;
    return p;
  }, [filters, debounced, page]);

  const products = useQuery({
    queryKey: ["shop", params],
    queryFn: () => catalogService.products(params),
  });

  const setFilter = (k: string, v: string) => {
    setFilters((f) => ({ ...f, [k]: f[k] === v ? "" : v }));
    setPage(1);
  };

  const activeCount = [
    "type",
    "branch",
    "year",
    "semester",
    "category",
    "min_price",
    "max_price",
    "rating",
  ].filter((k) => filters[k]).length;

  const count = products.data?.count ?? 0;

  // Accumulate pages for infinite scroll. Any filter/search change resets it.
  const [pageResults, setPageResults] = useState<Product[]>([]);
  useEffect(() => {
    setPageResults([]);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, debounced]);

  useEffect(() => {
    const rows = products.data?.results;
    if (!rows) return;
    if (page === 1) setPageResults(rows);
    else
      setPageResults((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...rows.filter((p) => !seen.has(p.id))];
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.data]);

  const loadingFirstPage = products.isLoading && pageResults.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setDrawer(true)}
          hitSlop={10}
          style={styles.hBtn}
        >
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Shop</Text>
        <Pressable
          onPress={() => navigation.navigate("Cart")}
          hitSlop={10}
          style={styles.hBtn}
        >
          <Ionicons name="cart-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search products, subjects…"
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textLight}
              />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={styles.filterBtn}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color={colors.brand} />
          {activeCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Result count + sort */}
      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.countText}>
          {products.isLoading
            ? "Loading…"
            : `${count} product${count === 1 ? "" : "s"} found`}
          {debounced ? ` for “${debounced}”` : ""}
        </Text>
        <Pressable style={styles.sortPill} onPress={() => setSortOpen(true)}>
          <Ionicons name="swap-vertical" size={13} color={colors.textMuted} />
          <Text style={styles.sortText}>
            {SORTS.find((s) => s.value === filters.ordering)?.label ?? "Sort"}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Quick type chips */}
      <View style={styles.typeBar}>
        <FlatList
          horizontal
          data={TYPES}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(t) => t.value}
          contentContainerStyle={{
            gap: spacing(2),
            paddingHorizontal: spacing(4),
            paddingVertical: spacing(1),
          }}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              active={filters.type === item.value}
              onPress={() => setFilter("type", item.value)}
            />
          )}
        />
      </View>

      {loadingFirstPage ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : (
        <FlatList
          data={pageResults}
          numColumns={2}
          keyExtractor={(p) => String(p.id)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshing={products.isFetching && page === 1}
          onRefresh={() => {
            setPage(1);
            products.refetch();
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>
                No products match your filters
              </Text>
              <Text style={styles.emptySub}>
                Try removing some filters or search a different subject.
              </Text>
              {activeCount > 0 ? (
                <Button
                  title="Clear all filters"
                  variant="outline"
                  onPress={() => {
                    setFilters({ ...EMPTY_FILTERS });
                    setPage(1);
                  }}
                  style={{ marginTop: spacing(4) }}
                />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              width={cardW}
              onPress={() =>
                navigation.navigate("ProductDetail", { slug: item.slug })
              }
              onAdd={() => handleAdd(item)}
              onToggleWishlist={() => handleWishlist(item)}
              wishlisted={isWishlisted(item.id)}
              inCart={inCart(item.id)}
              onGoToCart={() => navigation.navigate("Cart")}
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (products.data?.next && !products.isFetching) {
              setPage((p) => p + 1);
            }
          }}
          ListFooterComponent={
            products.isFetching && page > 1 ? (
              <ActivityIndicator
                color={colors.brand}
                style={{ marginVertical: spacing(4) }}
              />
            ) : (
              <View style={{ height: spacing(6) }} />
            )
          }
        />
      )}

      {/* Sort sheet — only sort options, as expected from the Sort pill */}
      <Modal
        visible={sortOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setSortOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSortOpen(false)}
        >
          <Pressable style={styles.sortSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort by</Text>
              <Pressable onPress={() => setSortOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            {SORTS.map((s) => {
              const active = filters.ordering === s.value;
              return (
                <Pressable
                  key={s.value}
                  style={styles.sortOption}
                  onPress={() => {
                    setFilters((f) => ({ ...f, ordering: s.value }));
                    setPage(1);
                    setSortOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      active && styles.sortOptionActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={18} color={colors.brand} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filters modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FilterGroup title="Type">
                {TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    active={filters.type === t.value}
                    onPress={() => setFilter("type", t.value)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Branch">
                {branches.data?.map((b) => (
                  <Chip
                    key={b.id}
                    label={b.short_name}
                    active={filters.branch === b.short_name}
                    onPress={() => setFilter("branch", b.short_name)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Semester">
                {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
                  <Chip
                    key={s}
                    label={`Sem ${s}`}
                    active={filters.semester === s}
                    onPress={() => setFilter("semester", s)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Year">
                {["1", "2", "3", "4"].map((y) => (
                  <Chip
                    key={y}
                    label={`Year ${y}`}
                    active={filters.year === y}
                    onPress={() => setFilter("year", y)}
                  />
                ))}
              </FilterGroup>

              {categories.data?.length ? (
                <FilterGroup title="Category">
                  {categories.data.map((c) => (
                    <Chip
                      key={c.slug}
                      label={c.name}
                      active={filters.category === c.slug}
                      onPress={() => setFilter("category", c.slug)}
                    />
                  ))}
                </FilterGroup>
              ) : null}

              <Text style={styles.groupTitle}>Price range (₹)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textLight}
                  value={filters.min_price}
                  onChangeText={(v) => {
                    setFilters((f) => ({ ...f, min_price: v }));
                    setPage(1);
                  }}
                />
                <Text style={{ color: colors.textMuted }}>–</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textLight}
                  value={filters.max_price}
                  onChangeText={(v) => {
                    setFilters((f) => ({ ...f, max_price: v }));
                    setPage(1);
                  }}
                />
              </View>

              <FilterGroup title="Rating">
                {["4", "3", "2"].map((r) => (
                  <Chip
                    key={r}
                    label={`${r}★ & above`}
                    active={filters.rating === r}
                    onPress={() => setFilter("rating", r)}
                  />
                ))}
              </FilterGroup>

              <Text style={styles.groupTitle}>Sort by</Text>
              <View style={styles.chips}>
                {SORTS.map((s) => (
                  <Chip
                    key={s.value}
                    label={s.label}
                    active={filters.ordering === s.value}
                    onPress={() => {
                      setFilters((f) => ({ ...f, ordering: s.value }));
                      setPage(1);
                    }}
                  />
                ))}
              </View>
              <View style={{ height: spacing(6) }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Clear all"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  setFilters({ ...EMPTY_FILTERS });
                  setPage(1);
                }}
              />
              <Button
                title="Apply"
                style={{ flex: 1 }}
                onPress={() => {
                  setPage(1);
                  setShowFilters(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {drawer ? (
        <DrawerMenu navigation={navigation} onClose={() => setDrawer(false)} />
      ) : null}
    </SafeAreaView>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing(4) }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chips}>{children}</View>
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
  },
  hBtn: { padding: spacing(1.5) },
  headerTitle: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  searchRow: {
    flexDirection: "row",
    gap: spacing(3),
    padding: spacing(4),
    paddingBottom: spacing(2),
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.accentDark,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    marginBottom: spacing(2.5),
    gap: spacing(3),
  },
  countText: { flex: 1, fontSize: font.small, color: colors.textMuted },
  typeBar: {
    marginBottom: spacing(3),
  },
  sortSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(5),
    paddingBottom: spacing(7),
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing(3.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  sortOptionText: { fontSize: font.body, color: colors.text },
  sortOptionActive: { color: colors.brand, fontWeight: "800" },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  sortText: { fontSize: font.tiny, color: colors.textMuted, fontWeight: "600" },
  list: {
    paddingHorizontal: spacing(4),
    // The tab bar is absolutely positioned over the content now, so reserve
    // enough room for it plus the gesture bar.
    paddingBottom: 130,
  },
  row: { justifyContent: "space-between", marginBottom: spacing(4) },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing(16),
    paddingHorizontal: spacing(8),
    gap: spacing(2),
  },
  emptyText: {
    fontSize: font.h3,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(3),
    textAlign: "center",
  },
  emptySub: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(5),
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(4),
  },
  modalTitle: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  groupTitle: {
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing(2.5),
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    marginBottom: spacing(4),
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    fontSize: font.body,
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing(3),
    marginTop: spacing(4),
  },
});
