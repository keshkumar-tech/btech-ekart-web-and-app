import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { cartService, orderService, paymentService } from "@/services";
import DrawerMenu from "@/components/DrawerMenu";
import { Button } from "@/components/ui";
import { apiError, mediaUrl } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { colors, font, radius, spacing } from "@/theme";
import type { PaymentMethod } from "@/types";

// react-native-razorpay is only available in a dev build / EAS build (not Expo Go).
// Import lazily so the app still runs in Expo Go for QR-only flows.
let RazorpayCheckout: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RazorpayCheckout = require("react-native-razorpay").default;
} catch {
  RazorpayCheckout = null;
}

export default function CheckoutScreen({ navigation }: any) {
  const qc = useQueryClient();
  const nav = useNavigation<any>();
  const { user, isAuthenticated } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>("razorpay");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [qrModal, setQrModal] = useState<{ order: any } | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | undefined>();
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.get,
  });
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: paymentService.settings,
  });

  const items = cart?.items ?? [];
  const subtotal = Number(cart?.subtotal ?? 0);
  const discount = appliedCoupon?.discount ?? 0;
  const payable = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await orderService.validateCoupon(
        coupon.trim().toUpperCase(),
        subtotal,
      );
      // The API returns `discount_amount` (the old code read `discount`, which
      // produced "₹NaN" in the summary).
      const amount = Number(
        (res as any).discount_amount ?? (res as any).discount ?? 0,
      );
      setAppliedCoupon({ code: res.code, discount: amount });
      Toast.show({
        type: "success",
        text1: "Coupon applied",
        text2: `You saved ₹${amount.toFixed(2)}`,
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Invalid coupon",
        text2: apiError(e),
      });
    }
  };

  const pickScreenshot = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Toast.show({
          type: "info",
          text1: "Permission needed",
          text2: "Allow photo access to attach your payment screenshot.",
        });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setScreenshotUri(res.assets[0].uri);
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not open your photos" });
    }
  };

  const createOrder = async (paymentMethod: "razorpay" | "manual_qr") => {
    setPlacing(true);
    try {
      const order = await orderService.create({
        coupon_code: appliedCoupon?.code,
        payment_method: paymentMethod,
      });
      return order;
    } catch (e) {
      Toast.show({ type: "error", text1: "Order failed", text2: apiError(e) });
      return null;
    } finally {
      setPlacing(false);
    }
  };

  const onRazorpay = async () => {
    const order = await createOrder("razorpay");
    if (!order) return;

    if (!RazorpayCheckout) {
      Toast.show({
        type: "info",
        text1: "Razorpay needs a dev build",
        text2:
          "Run `npx expo run:android` or an EAS build. Using QR flow for now.",
        visibilityTime: 4000,
      });
      setQrModal({ order });
      return;
    }

    try {
      const rzpOrder = await paymentService.createRazorpayOrder(
        order.order_number,
      );
      const options = {
        description: `B.Tech eKart order ${order.order_number}`,
        currency: "INR",
        key: rzpOrder.key_id,
        amount: rzpOrder.amount,
        name: "B.Tech eKart",
        order_id: rzpOrder.razorpay_order_id,
        prefill: rzpOrder.prefill ?? {},
        theme: { color: colors.brand },
      };
      const result = await RazorpayCheckout.open(options);
      await paymentService.verifyRazorpay({
        order_number: order.order_number,
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["library"] });
      Toast.show({ type: "success", text1: "Payment successful" });
      navigation.replace("OrderSuccess", { orderId: order.id });
    } catch (e: any) {
      // Payment cancelled / failed -> order stays pending so it can be retried
      if (e?.code === 2) {
        Toast.show({ type: "info", text1: "Payment cancelled" });
      } else {
        Toast.show({
          type: "error",
          text1: "Payment failed",
          text2: e?.description ?? apiError(e),
        });
      }
    }
  };

  const onQr = async () => {
    const order = await createOrder("manual_qr");
    if (!order) return;
    setQrModal({ order });
    setUtr("");
  };

  const submitUtr = async () => {
    if (!qrModal) return;
    if (!utr.trim()) {
      Toast.show({ type: "error", text1: "Enter the UTR / transaction ID" });
      return;
    }
    setSubmittingUtr(true);
    try {
      await orderService.submitManualPayment({
        orderNumber: qrModal.order.order_number,
        utr: utr.trim(),
        screenshotUri,
      });
      setQrModal(null);
      qc.invalidateQueries({ queryKey: ["orders"] });
      Toast.show({
        type: "success",
        text1: "Payment submitted",
        text2: "We will verify your payment and unlock your purchase shortly.",
      });
      navigation.replace("OrderSuccess", {
        orderId: qrModal.order.id,
        pending: true,
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Could not submit",
        text2: apiError(e),
      });
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>Please log in first</Text>
          <Text style={styles.emptySub}>
            Log in to complete your purchase and unlock your downloads
            instantly.
          </Text>
          <Button
            title="Log in to checkout"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: spacing(4) }}
          />
        </View>
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

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Button
            title="Shop Now"
            onPress={() => nav.navigate("Tabs", { screen: "Shop" })}
            style={{ marginTop: spacing(4) }}
          />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <Pressable
          onPress={() => setDrawer(true)}
          hitSlop={10}
          style={styles.headerBack}
        >
          <Ionicons name="menu-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Instant delivery to your email and library after payment.
        </Text>

        {/* Contact details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact details</Text>
          <Field label="Name" value={user?.name || "—"} />
          <Field label="Email" value={user?.email || "—"} />
          <Field label="Phone" value={user?.phone || "—"} />
          <Text style={styles.hint}>
            Update these in your profile. Purchased material is delivered to this
            email.
          </Text>
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment method</Text>
          <MethodOption
            active={method === "razorpay"}
            icon="card-outline"
            title="Pay Online (Razorpay)"
            desc="UPI, cards, netbanking, wallets — instant access after payment"
            onPress={() => setMethod("razorpay")}
          />
          <MethodOption
            active={method === "manual_qr"}
            icon="qr-code-outline"
            title="Pay via UPI / QR"
            desc="Scan our QR, pay, then submit your UTR for verification"
            onPress={() => setMethod("manual_qr")}
          />
        </View>

        {/* Items summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Order summary ({items.length} item{items.length > 1 ? "s" : ""})
          </Text>
          {items.map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <Image
                source={{ uri: mediaUrl(it.product.cover_image) }}
                style={styles.thumb}
              />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {it.product.title}
                </Text>
                <Text style={styles.itemMeta}>
                  Qty {it.quantity} · {it.product.subject_code}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                ₹{Number(it.product.price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Have a coupon?</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              value={coupon}
              onChangeText={setCoupon}
              editable={!appliedCoupon}
            />
            <Button
              title={appliedCoupon ? "Remove" : "Apply"}
              variant={appliedCoupon ? "outline" : "primary"}
              onPress={
                appliedCoupon
                  ? () => {
                      setAppliedCoupon(null);
                      setCoupon("");
                    }
                  : applyCoupon
              }
              style={{ paddingHorizontal: spacing(5) }}
            />
          </View>
          {appliedCoupon ? (
            <Text style={styles.couponApplied}>
              ✓ {appliedCoupon.code} applied
            </Text>
          ) : null}
        </View>

        {/* Price details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price details</Text>
          <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
          {discount > 0 ? (
            <Row
              label={`Coupon (${appliedCoupon?.code})`}
              value={`−₹${discount.toFixed(2)}`}
              valueColor={colors.success}
            />
          ) : null}
          <Row label="Delivery" value="FREE" valueColor={colors.success} />
          <View style={styles.divider} />
          <Row label="Total payable" value={`₹${payable.toFixed(2)}`} bold />
        </View>

        {/* Manual QR preview */}
        {settings?.manual_qr_enabled && settings?.qr_code_image ? (
          <View style={[styles.card, styles.qrCard]}>
            <Image
              source={{ uri: mediaUrl(settings.qr_code_image) }}
              style={styles.qrPreview}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>Pay by UPI / QR</Text>
              <Text style={styles.qrSub}>
                Scan the owner's QR, pay ₹{payable.toFixed(2)} and submit your
                UTR. Admin verifies and unlocks instantly.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Pay buttons */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerValue}>₹{payable.toFixed(2)}</Text>
        </View>
        {method === "razorpay" ? (
          <Button
            title={`Pay ₹${payable.toFixed(2)}`}
            onPress={onRazorpay}
            loading={placing}
          />
        ) : (
          <Button
            title={`Show QR & pay ₹${payable.toFixed(2)}`}
            variant="accent"
            onPress={onQr}
            loading={placing}
          />
        )}
        <Text style={styles.secureNote}>
          🔒 Secure checkout. Material unlocks instantly after payment
          verification.
        </Text>
      </View>

      {drawer ? (
        <DrawerMenu navigation={navigation} onClose={() => setDrawer(false)} />
      ) : null}

      {/* QR / UTR modal */}
      <Modal
        visible={!!qrModal}
        animationType="slide"
        transparent
        onRequestClose={() => setQrModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete your UPI payment</Text>
              <Pressable onPress={() => setQrModal(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.orderRef}>
                Order ID: {qrModal?.order?.order_number}
              </Text>
              <Text style={styles.amountDue}>
                Amount payable: ₹{payable.toFixed(2)}
              </Text>

              {settings?.qr_code_image ? (
                <Image
                  source={{ uri: mediaUrl(settings.qr_code_image) }}
                  style={styles.qrImage}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons
                    name="qr-code-outline"
                    size={64}
                    color={colors.textLight}
                  />
                  <Text style={styles.qrPlaceholderText}>
                    QR not configured — contact support
                  </Text>
                </View>
              )}
              <Text style={styles.scanHint}>Scan with any UPI app</Text>

              {settings?.payment_instructions ? (
                <Text style={styles.instructions}>
                  {settings.payment_instructions}
                </Text>
              ) : null}

              <Text style={styles.fieldLabel}>UTR / Transaction ID *</Text>
              <TextInput
                style={styles.utrInput}
                placeholder="e.g. 402312345678"
                placeholderTextColor={colors.textLight}
                value={utr}
                onChangeText={setUtr}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>
                Payment screenshot (optional, speeds up verification)
              </Text>
              <Pressable style={styles.uploadBtn} onPress={pickScreenshot}>
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={colors.brand}
                />
                <Text style={styles.uploadText}>
                  {screenshotUri ? "Change screenshot" : "Attach screenshot"}
                </Text>
              </Pressable>
              {screenshotUri ? (
                <Image
                  source={{ uri: screenshotUri }}
                  style={styles.screenshot}
                />
              ) : null}

              <Button
                title="I have paid — Submit for verification"
                onPress={submitUtr}
                loading={submittingUtr}
                disabled={!utr.trim()}
                style={{ marginTop: spacing(4) }}
              />
              <Text style={styles.note}>
                Your order stays "Pending verification" until the admin confirms
                the payment. You'll get a notification once unlocked.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBack}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Checkout</Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: spacing(2.5) }}>
      <Text style={styles.fieldReadLabel}>{label}</Text>
      <View style={styles.fieldReadBox}>
        <Text numberOfLines={1} style={styles.fieldReadValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MethodOption({
  active,
  onPress,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.method, active && styles.methodActive]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? colors.brand : colors.textLight}
      />
      <View style={{ flex: 1 }}>
        <View style={styles.methodTitleRow}>
          <Text style={styles.methodTitle}>{title}</Text>
          {active ? (
            <Ionicons name="checkmark-circle" size={16} color={colors.brand} />
          ) : null}
        </View>
        <Text style={styles.methodDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

function Row({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.bold]}>{label}</Text>
      <Text
        style={[
          styles.priceValue,
          bold && styles.bold,
          valueColor ? { color: valueColor } : null,
        ]}
      >
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
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(3),
  },
  emptyTitle: { fontSize: font.h3, fontWeight: "700", color: colors.textMuted },
  emptySub: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing(8),
  },
  scroll: { padding: spacing(4), gap: spacing(3), paddingBottom: spacing(6) },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(3),
  },
  cardTitle: { fontSize: font.body, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: font.tiny, color: colors.textMuted },
  hint: { fontSize: font.tiny, color: colors.textLight, lineHeight: 16 },
  fieldReadLabel: {
    fontSize: font.tiny,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing(1),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldReadBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.75),
  },
  fieldReadValue: { fontSize: font.body, color: colors.text },
  method: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(3),
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(3.5),
  },
  methodActive: { borderColor: colors.brand, backgroundColor: colors.brandLight },
  methodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
  },
  methodTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  methodDesc: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  couponApplied: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.success,
    marginTop: spacing(1),
  },
  secureNote: {
    fontSize: font.tiny,
    color: colors.textLight,
    textAlign: "center",
  },
  scanHint: {
    fontSize: font.tiny,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(1),
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
  },
  uploadText: { fontSize: font.small, fontWeight: "700", color: colors.brand },
  screenshot: {
    width: 120,
    height: 160,
    borderRadius: radius.sm,
    marginTop: spacing(2),
    alignSelf: "center",
  },
  itemRow: { flexDirection: "row", gap: spacing(3), alignItems: "center" },
  thumb: {
    width: 48,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
  },
  itemTitle: { fontSize: font.small, fontWeight: "600", color: colors.text },
  itemMeta: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: font.small, fontWeight: "700", color: colors.text },
  couponRow: { flexDirection: "row", gap: spacing(2) },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: font.body, color: colors.textMuted },
  priceValue: { fontSize: font.body, fontWeight: "600", color: colors.text },
  bold: { fontWeight: "800", fontSize: font.h3, color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing(2),
  },
  qrCard: { flexDirection: "row", alignItems: "center", gap: spacing(4) },
  qrPreview: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
  },
  qrTitle: { fontSize: font.body, fontWeight: "800", color: colors.text },
  qrSub: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing(1),
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing(4),
    paddingBottom: spacing(7),
    gap: spacing(3),
  },
  footerTotal: { flexDirection: "row", justifyContent: "space-between" },
  footerLabel: { fontSize: font.body, color: colors.textMuted },
  footerValue: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  footerActions: { flexDirection: "row", gap: spacing(3) },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(5),
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(3),
  },
  modalTitle: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  orderRef: { fontSize: font.small, color: colors.textMuted },
  amountDue: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(1),
    marginBottom: spacing(4),
  },
  qrImage: {
    width: 220,
    height: 220,
    alignSelf: "center",
    borderRadius: radius.md,
    marginVertical: spacing(3),
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    marginVertical: spacing(3),
    gap: spacing(2),
  },
  qrPlaceholderText: { color: colors.textLight, fontSize: font.small },
  instructions: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing(4),
  },
  fieldLabel: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing(2),
  },
  utrInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    fontSize: font.body,
    color: colors.text,
  },
  note: {
    fontSize: font.tiny,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(3),
    lineHeight: 18,
  },
});
