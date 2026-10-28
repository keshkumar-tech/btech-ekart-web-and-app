// Admin · Commerce tab — every commerce menu the web /admin sidebar has.
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/admin";
import { formatINR } from "@/lib/utils";
import { font, radius, shadow, spacing } from "@/theme";
import { useTheme } from "@/store/theme";
import {
  AdminTabBody,
  AdminTabHeader,
  MenuCard,
  type AdminMenuItem,
} from "./AdminTabParts";

export default function AdminCommerceTab({ navigation }: any) {
  const { colors: c } = useTheme();
  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: dashboardService.overview,
  });

  const items: AdminMenuItem[] = [
    {
      key: "orders",
      label: "Orders",
      description: "Every order, manual-QR approvals, refunds & invoices",
      icon: "receipt-outline",
      screen: "AdminOrders",
      tone: "#6366f1",
      badge: Number(stats.data?.pending_verification ?? 0),
    },
    {
      key: "customers",
      label: "Customers",
      description: "Full profiles, purchases, cart, wishlist & spend",
      icon: "people-outline",
      screen: "AdminCustomers",
      tone: "#a855f7",
    },
    {
      key: "products",
      label: "Products",
      description: "Notes, PYQs, quantums, combos — create & edit",
      icon: "cube-outline",
      screen: "AdminProducts",
      tone: "#0ea5e9",
    },
    {
      key: "coupons",
      label: "Coupons",
      description: "Discount codes, usage limits & validity",
      icon: "pricetag-outline",
      screen: "AdminCoupons",
      tone: "#f59e0b",
    },
    {
      key: "taxonomy",
      label: "Catalog setup",
      description: "Branches, categories and subjects",
      icon: "layers-outline",
      screen: "AdminTaxonomy",
      tone: "#14b8a6",
    },
  ];

  const open = (item: AdminMenuItem) =>
    navigation.navigate(item.screen, item.params);

  const kpis = [
    { label: "Revenue", value: formatINR(stats.data?.total_revenue ?? 0) },
    { label: "Paid orders", value: String(stats.data?.paid_orders ?? 0) },
    {
      label: "To verify",
      value: String(stats.data?.pending_verification ?? 0),
    },
  ];

  return (
    <AdminTabBody>
      <AdminTabHeader
        title="Commerce"
        subtitle="Orders · products · customers"
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(10) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiRow}>
          {kpis.map((k) => (
            <View
              key={k.label}
              style={[styles.kpi, { backgroundColor: c.card }, shadow.card]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.kpiValue, { color: c.text }]}
              >
                {k.value}
              </Text>
              <Text style={[styles.kpiLabel, { color: c.textMuted }]}>
                {k.label}
              </Text>
            </View>
          ))}
        </View>
        <MenuCard items={items} onOpen={open} />
      </ScrollView>
    </AdminTabBody>
  );
}

const styles = StyleSheet.create({
  kpiRow: {
    flexDirection: "row",
    gap: spacing(3),
    padding: spacing(4),
    paddingBottom: 0,
  },
  kpi: { flex: 1, borderRadius: radius.lg, padding: spacing(3) },
  kpiValue: { fontSize: font.body, fontWeight: "800" },
  kpiLabel: { fontSize: font.tiny, marginTop: 2 },
});
