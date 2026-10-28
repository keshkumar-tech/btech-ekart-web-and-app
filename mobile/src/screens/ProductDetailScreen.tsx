import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { catalogService, reviewsService } from "@/services";
import ProductCard from "@/components/ProductCard";
import { Badge, Button, Price, Stars } from "@/components/ui";
import { useCart, useWishlist } from "@/hooks/useShop";
import { useAuth } from "@/store/auth";
import { requireLogin } from "@/lib/authGate";
import { mediaUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { shareProduct } from "@/lib/share";
import { colors, font, radius, shadow, spacing, TYPE_LABELS } from "@/theme";
import type { Product } from "@/types";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen({ navigation, route }: any) {
  const { slug } = route.params;
  const { addToCart, inCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [comment, setComment] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalogService.product(slug),
  });

  const related = useQuery({
    queryKey: ["related", product?.id],
    queryFn: () =>
      catalogService.products({
        subject_code: product?.subject_code,
        page_size: 8,
      }),
    enabled: !!product,
  });

  const reviews = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => reviewsService.forProduct(slug),
    enabled: !!product,
  });

  const submitReview = useMutation({
    mutationFn: () =>
      reviewsService.create(slug, {
        product: product!.id,
        rating,
        title: reviewTitle.trim() || undefined,
        comment: comment.trim(),
      }),
    onSuccess: (res: any) => {
      setRating(0);
      setReviewTitle("");
      setComment("");
      Toast.show({
        type: "success",
        text1: res?.pending_approval
          ? "Review submitted"
          : "Thanks for your review!",
        text2: res?.pending_approval
          ? "It goes live once a moderator approves it."
          : undefined,
      });
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
      qc.invalidateQueries({ queryKey: ["product", slug] });
    },
    onError: (e: any) =>
      Toast.show({
        type: "error",
        text1: "Could not submit your review",
        text2: e?.message,
      }),
  });

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} title="" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const alreadyInCart = inCart(product.id);

  // Guests must log in before buying or saving.
  const handleAdd = () => {
    if (alreadyInCart) {
      navigation.navigate("Cart");
      return;
    }
    if (!requireLogin(navigation, isAuthenticated, "add to cart")) return;
    addToCart(product);
  };
  const handleBuyNow = () => {
    if (inLibrary) {
      navigation.navigate("MyLibrary");
      return;
    }
    if (!requireLogin(navigation, isAuthenticated, "checkout")) return;
    addToCart(product);
    navigation.navigate("Cart");
  };
  const handleWishlist = () => {
    if (!requireLogin(navigation, isAuthenticated, "save to wishlist")) return;
    toggleWishlist(product);
  };
  const relatedItems = (related.data?.results ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 6);
  const inLibrary = product.is_owned;

  const openRelated = (p: Product) =>
    navigation.push("ProductDetail", { slug: p.slug });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header onBack={() => navigation.goBack()} title={product.title} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        // The sticky CTA bar + the gesture area are drawn ON TOP of the scroll
        // content, so reserve their full height (button 46 + 16 padding + 24
        // bottom pad + ~34 gesture bar) or the last section is unreachable.
        contentContainerStyle={{ paddingBottom: 170 }}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: mediaUrl(product.cover_image) }}
            style={styles.image}
            resizeMode="cover"
          />
          <Pressable
            style={styles.heartFab}
            onPress={handleWishlist}
            hitSlop={8}
          >
            <Ionicons
              name={wishlisted ? "heart" : "heart-outline"}
              size={22}
              color={wishlisted ? colors.danger : colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Badge
              text={TYPE_LABELS[product.type] ?? String(product.type)}
              bg={colors.brandLight}
              fg={colors.brand}
            />
            {product.discount > 0 ? (
              <Badge
                text={`${product.discount}% off`}
                bg="#ffe4e6"
                fg="#e11d48"
              />
            ) : null}
            {product.branch ? (
              <Badge
                text={product.branch.short_name}
                bg="#f1f5f9"
                fg="#475569"
              />
            ) : null}
            {product.semester ? (
              <Badge
                text={`Sem ${product.semester}`}
                bg="#f1f5f9"
                fg="#475569"
              />
            ) : null}
            {product.is_trending ? (
              <Badge text="🔥 Trending" bg="#ffe4e6" fg="#e11d48" />
            ) : null}
          </View>

          <Text style={styles.title}>{product.title}</Text>
          {product.subject_code ? (
            <Text style={styles.subjectCode}>{product.subject_code}</Text>
          ) : null}

          <View style={styles.ratingRow}>
            <Stars rating={product.rating} count={product.rating_count} />
            <Text style={styles.ratingText}>
              {product.rating_count > 0
                ? `${product.rating} (${product.rating_count} reviews)`
                : "No reviews yet"}
            </Text>
          </View>

          <View style={styles.savePill}>
            <Text style={styles.saveText}>
              {product.sold_count > 0 ? `${product.sold_count} sold · ` : ""}
              ⚡ Instant download · secure checkout
            </Text>
          </View>

          <Price
            price={product.price}
            mrp={product.mrp}
            discount={product.discount}
            size="lg"
          />
          {product.you_save > 0 ? (
            <Text style={styles.youSave}>
              ✓ You save ₹{Number(product.you_save).toLocaleString("en-IN")}
            </Text>
          ) : null}

          {/* Preview actions */}
          <View style={styles.previewRow}>
            <Pressable
              style={styles.previewBtn}
              onPress={() =>
                navigation.navigate("Preview", {
                  slug: product.slug,
                  title: product.title,
                })
              }
            >
              <Ionicons name="eye-outline" size={17} color={colors.text} />
              <Text style={styles.previewBtnText}>View preview</Text>
            </Pressable>
          </View>

          <View style={styles.metaGrid}>
            <Meta
              icon="document-outline"
              label="Pages"
              value={product.page_count ? String(product.page_count) : "—"}
            />
            <Meta
              icon="pricetag-outline"
              label="Type"
              value={(TYPE_LABELS[product.type] ?? product.type) as string}
            />
            <Meta
              icon="bookmark-outline"
              label="Subject"
              value={product.subject?.name || "—"}
            />
          </View>

          {/* What's included */}
          <Text style={styles.sectionTitle}>What&apos;s included</Text>
          <View style={styles.includedCard}>
            <Included text={`Complete ${TYPE_LABELS[product.type] ?? "study"} material`} />
            <Included
              text={`${product.page_count || "Multiple"} pages of content`}
            />
            <Included text="Instant PDF download after payment" />
            <Included text="Lifetime access in My Library" />
            {product.subject_code ? (
              <Included text={`Subject code: ${product.subject_code}`} />
            ) : null}
            <Included text="Updated for the latest AKTU syllabus" />
          </View>

          {/* Details */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            <Detail label="Type" value={product.type_display || "—"} />
            <Detail label="Branch" value={product.branch?.name || "—"} />
            <Detail
              label="Semester"
              value={product.semester ? `Semester ${product.semester}` : "—"}
            />
            <Detail label="Subject" value={product.subject?.name || "—"} />
            <Detail label="Subject Code" value={product.subject_code || "—"} />
            <Detail
              label="Pages"
              value={String(product.page_count || "—")}
            />
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.description}
            numberOfLines={expanded ? undefined : 5}
          >
            {product.description}
          </Text>
          {product.description && product.description.length > 200 ? (
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Text style={styles.readMore}>
                {expanded ? "Show less" : "Read more"}
              </Text>
            </Pressable>
          ) : null}

          {product.tags_list?.length ? (
            <View style={styles.tags}>
              {product.tags_list.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.assurance}>
            <AssuranceRow
              icon="flash-outline"
              text="Instant download after payment"
            />
            <AssuranceRow
              icon="infinite-outline"
              text="Lifetime access in My Library"
            />
            <AssuranceRow
              icon="shield-checkmark-outline"
              text="Secure checkout — Razorpay or UPI QR"
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing(7) }]}>
            Reviews
          </Text>
          {reviews.isLoading ? (
            <ActivityIndicator
              color={colors.brand}
              style={{ marginTop: spacing(3) }}
            />
          ) : (reviews.data?.length ?? 0) === 0 ? (
            <Text style={styles.noReviews}>
              No reviews yet — be the first to review this material.
            </Text>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.data?.slice(0, 4).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <View style={styles.reviewerRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {(r.user_name || "S").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewer}>
                          {r.user_name || "Student"}
                        </Text>
                        {r.is_verified_purchase ? (
                          <Text style={styles.verifiedBadge}>
                            ✓ Verified purchase
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Stars rating={r.rating} />
                  </View>
                  {r.title ? (
                    <Text style={styles.reviewTitle}>{r.title}</Text>
                  ) : null}
                  <Text style={styles.reviewBody}>{r.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {formatDate(r.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Write a review */}
          <Text style={[styles.sectionTitle, { marginTop: spacing(7) }]}>
            Write a review
          </Text>
          {!isAuthenticated ? (
            <Text style={styles.noReviews}>
              Please log in to review this product. Any signed-in student can
              review any material.
            </Text>
          ) : (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>Rating</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    hitSlop={6}
                    onPress={() => setRating(n)}
                    accessibilityLabel={`${n} star`}
                  >
                    <Ionicons
                      name={n <= rating ? "star" : "star-outline"}
                      size={28}
                      color={n <= rating ? colors.accent : colors.textLight}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.formLabel}>Title (optional)</Text>
              <TextInput
                style={styles.formInput}
                value={reviewTitle}
                onChangeText={setReviewTitle}
                placeholder="Summarise your experience"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.formLabel}>Your review</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={comment}
                onChangeText={setComment}
                placeholder="What did you like?"
                placeholderTextColor={colors.textLight}
                multiline
                textAlignVertical="top"
              />
              <Button
                title={submitReview.isPending ? "Submitting..." : "Submit review"}
                loading={submitReview.isPending}
                disabled={!rating || !comment.trim()}
                onPress={() => submitReview.mutate()}
                style={{ marginTop: spacing(2) }}
              />
              {submitReview.isError ? (
                <Text style={styles.formError}>
                  Could not submit your review. Please try again.
                </Text>
              ) : null}
            </View>
          )}

          {relatedItems.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing(7) }]}>
                Related material
              </Text>
              <FlatList
                horizontal
                data={relatedItems}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(p) => String(p.id)}
                contentContainerStyle={{ gap: spacing(3) }}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={() => openRelated(item)}
                    onToggleWishlist={() => handleWishlist()}
                    wishlisted={isWishlisted(item.id)}
                    inCart={inCart(item.id)}
                    onGoToCart={() => navigation.navigate("Cart")}
                  />
                )}
              />
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={styles.ctaOutline}
          onPress={handleAdd}
        >
          <Ionicons
            name={alreadyInCart ? "bag-check-outline" : "cart-outline"}
            size={18}
            color={alreadyInCart ? colors.success : colors.brand}
          />
          <Text
            style={[
              styles.ctaOutlineText,
              alreadyInCart && { color: colors.success },
            ]}
          >
            {alreadyInCart ? "Go to Cart" : "Add to Cart"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.shareCta}
          onPress={() => shareProduct(product)}
          accessibilityLabel="Share this product"
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={colors.text}
          />
        </Pressable>
        <Pressable
          style={[styles.ctaFill, inLibrary && styles.ctaOwned]}
          onPress={handleBuyNow}
        >
          <Ionicons
            name={inLibrary ? "cloud-download-outline" : "flash-outline"}
            size={18}
            color={colors.white}
          />
          <Text style={styles.ctaFillText}>
            {inLibrary ? "Download now" : "Buy Now"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBack}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={20} color={colors.brand} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  );
}

function AssuranceRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.assuranceRow}>
      <Ionicons name={icon} size={18} color={colors.success} />
      <Text style={styles.assuranceText}>{text}</Text>
    </View>
  );
}

function Included({ text }: { text: string }) {
  return (
    <View style={styles.includedRow}>
      <Ionicons name="checkmark" size={14} color={colors.success} />
      <Text style={styles.includedText}>{text}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>
        {value}
      </Text>
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
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageWrap: {
    width,
    // The cover is 3:4; a near-square frame was taller than the viewport and
    // pushed the price and the buy buttons off-screen.
    aspectRatio: 1.15,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%" },
  heartFab: {
    position: "absolute",
    top: spacing(4),
    right: spacing(4),
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radius.pill,
    padding: spacing(2.5),
    ...shadow.card,
  },
  body: {
    padding: spacing(5),
    backgroundColor: colors.white,
    marginTop: -spacing(4),
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  title: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 30,
  },
  subjectCode: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing(1),
    marginBottom: spacing(2),
  },
  metaGrid: { flexDirection: "row", gap: spacing(3), marginTop: spacing(5) },
  metaItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing(1),
    padding: spacing(3),
    backgroundColor: colors.bg,
    borderRadius: radius.md,
  },
  metaLabel: { fontSize: font.tiny, color: colors.textMuted },
  metaValue: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(6),
    marginBottom: spacing(2),
  },
  description: { fontSize: font.body, color: colors.textMuted, lineHeight: 22 },
  readMore: {
    color: colors.brand,
    fontWeight: "700",
    marginTop: spacing(2),
    fontSize: font.small,
  },
  assurance: { marginTop: spacing(5), gap: spacing(2.5) },
  assuranceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
  },
  assuranceText: {
    fontSize: font.small,
    color: colors.text,
    fontWeight: "500",
  },
  noReviews: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing(1),
  },
  reviewsList: { marginTop: spacing(2), gap: spacing(3) },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing(3.5),
    gap: spacing(1.5),
    ...shadow.card,
  },
  reviewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewerRow: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: font.small,
    fontWeight: "800",
    color: colors.brand,
  },
  reviewer: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
  },
  verifiedBadge: {
    fontSize: font.tiny,
    fontWeight: "700",
    color: colors.success,
    marginTop: 2,
  },
  reviewTitle: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
  },
  reviewBody: { fontSize: font.small, color: colors.textMuted, lineHeight: 20 },
  reviewDate: {
    fontSize: font.tiny,
    color: colors.textLight,
    marginTop: spacing(0.5),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    flexWrap: "wrap",
    marginTop: spacing(1),
  },
  ratingText: { fontSize: font.tiny, color: colors.textMuted },
  savePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    marginTop: spacing(2),
    marginBottom: spacing(2),
  },
  saveText: { fontSize: font.tiny, color: colors.textMuted },
  youSave: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.success,
    marginTop: spacing(1),
  },
  previewRow: { flexDirection: "row", marginTop: spacing(4) },
  previewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing(2.75),
  },
  previewBtnText: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
  },
  includedCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing(3.5),
    gap: spacing(2),
  },
  includedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(2),
  },
  includedText: { flex: 1, fontSize: font.small, color: colors.text, lineHeight: 19 },
  detailsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(3),
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  detailLabel: { fontSize: font.small, color: colors.textMuted },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: font.small,
    fontWeight: "600",
    color: colors.text,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    marginTop: spacing(3),
  },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  tagText: { fontSize: font.tiny, color: colors.textMuted, fontWeight: "600" },
  previewSafe: { flex: 1, backgroundColor: colors.white },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewTitle: {
    flex: 1,
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
  },
  previewClose: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.brand,
  },
  previewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(3),
    backgroundColor: colors.white,
  },
  previewLoadingText: { fontSize: font.small, color: colors.textMuted },
  reviewForm: {
    marginTop: spacing(2),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(2),
  },
  formLabel: {
    fontSize: font.tiny,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  starRow: { flexDirection: "row", gap: spacing(1) },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    fontSize: font.small,
    color: colors.text,
    backgroundColor: colors.white,
  },
  formTextArea: { minHeight: 96 },
  formError: {
    fontSize: font.small,
    color: colors.danger,
    marginTop: spacing(1),
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing(3),
    padding: spacing(4),
    paddingBottom: spacing(6),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },  ctaOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing(3.5),
  },
  shareCta: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  ctaOutlineText: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: font.body,
  },
  ctaFill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing(3.5),
  },
  ctaOwned: { backgroundColor: colors.success },
  ctaFillText: { color: colors.white, fontWeight: "800", fontSize: font.body },
});
