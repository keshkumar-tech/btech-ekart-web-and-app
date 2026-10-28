// Admin customer detail — profile, spend, purchases, orders, cart, wishlist.
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/admin";
import { AdminHeader, adminStyles } from "@/components/admin";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export default function AdminCustomerDetailScreen({ navigation, route }: any) {
  const { colors: c } = useTheme();
  const { userId } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer", userId],
    queryFn: () => dashboardService.customer(userId),
  });

  if (isLoading || !data) {
    return (
      <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
        <AdminHeader title="Customer" onBack={() => navigation.goBack()} />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const p = data.profile;

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title={p.name || "Customer"}
        subtitle={p.email}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing(4),
          paddingBottom: spacing(12),
        }}
      >
        <View style={styles.card}>
          <Text style={styles.name}>{p.name || "—"}</Text>
          <Row label="Email" value={p.email} />
          <Row label="Phone" value={p.phone || "—"} />
          <Row label="College" value={p.college || "—"} />
          <Row label="Branch" value={p.branch || "—"} />
          <Row label="Year" value={p.year ? `Year ${p.year}` : "—"} />
          <Row label="Role" value={p.role} />
          <Row label="Email verified" value={p.email_verified ? "Yes" : "No"} />
          <Row label="Joined" value={formatDate(p.date_joined)} />
        </View>

        <View style={styles.statsRow}>
          <Stat
            label="Total spent"
            value={formatINR(data.total_spent)}
            tone="#10b981"
          />
          <Stat
            label="Orders"
            value={String(data.orders_count)}
            tone="#6366f1"
          />
          <Stat
            label="Paid"
            value={String(data.paid_orders_count)}
            tone="#0ea5e9"
          />
        </View>

        <Section title={`Purchases (${data.purchases.length})`}>
          {data.purchases.length === 0 ? (
            <Text style={styles.muted}>No purchases yet.</Text>
          ) : (
            data.purchases.map((row: any) => (
              <View key={row.id} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineTitle}>{row.title}</Text>
                  <Text style={styles.muted}>
                    {row.order_number} · {row.status} ·{" "}
                    {formatDate(row.purchased_at || row.order_created_at)}
                  </Text>
                </View>
                <Text style={styles.lineValue}>
                  {formatINR(row.total_price)}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Section title={`Orders (${data.orders.length})`}>
          {data.orders.length === 0 ? (
            <Text style={styles.muted}>No orders.</Text>
          ) : (
            data.orders.map((o: any) => (
              <Pressable
                key={o.id}
                style={styles.line}
                onPress={() =>
                  navigation.navigate("AdminOrderDetail", {
                    orderNumber: o.order_number,
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineTitle}>{o.order_number}</Text>
                  <Text style={styles.muted}>
                    {formatDateTime(o.created_at)} · {o.status_display}
                  </Text>
                </View>
                <Text style={styles.lineValue}>
                  {formatINR(o.total_amount)}
                </Text>
              </Pressable>
            ))
          )}
        </Section>

        <Section title={`Cart (${data.cart.length})`}>
          {data.cart.length === 0 ? (
            <Text style={styles.muted}>Cart is empty.</Text>
          ) : (
            data.cart.map((c: any) => (
              <View key={c.product_id} style={styles.line}>
                <Text style={[styles.lineTitle, { flex: 1 }]}>{c.title}</Text>
                <Text style={styles.muted}>×{c.quantity}</Text>
                <Text style={styles.lineValue}>{formatINR(c.price)}</Text>
              </View>
            ))
          )}
        </Section>

        <Section title={`Wishlist (${data.wishlist.length})`}>
          {data.wishlist.length === 0 ? (
            <Text style={styles.muted}>Wishlist is empty.</Text>
          ) : (
            data.wishlist.map((w: any) => (
              <Pressable
                key={w.product_id}
                style={styles.line}
                onPress={() =>
                  navigation.navigate("ProductDetail", { slug: w.slug })
                }
              >
                <Text style={[styles.lineTitle, { flex: 1 }]}>{w.title}</Text>
                <Text style={styles.lineValue}>{formatINR(w.price)}</Text>
              </Pressable>
            ))
          )}
        </Section>

        <Section title={`Payments (${data.payments.length})`}>
          {data.payments.length === 0 ? (
            <Text style={styles.muted}>No payments.</Text>
          ) : (
            data.payments.map((pay: any) => (
              <View key={pay.id} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineTitle}>
                    {pay.gateway} · {pay.status}
                  </Text>
                  <Text style={styles.muted}>
                    {formatDateTime(pay.created_at)}
                    {pay.utr_number ? ` · UTR ${pay.utr_number}` : ""}
                  </Text>
                </View>
                <Text style={styles.lineValue}>{formatINR(pay.amount)}</Text>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginBottom: spacing(3),
    gap: spacing(2),
  },
  name: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  title: { fontSize: font.body, fontWeight: "800", color: colors.text },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(3),
  },
  rowLabel: { fontSize: font.small, color: colors.textMuted },
  rowValue: {
    fontSize: font.small,
    color: colors.text,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  statsRow: { flexDirection: "row", gap: spacing(3), marginBottom: spacing(3) },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(3),
    alignItems: "center",
  },
  statValue: { fontSize: font.body, fontWeight: "800" },
  muted: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    paddingVertical: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },
  lineTitle: { fontSize: font.small, fontWeight: "600", color: colors.text },
  lineValue: { fontSize: font.small, fontWeight: "700", color: colors.text },
});
