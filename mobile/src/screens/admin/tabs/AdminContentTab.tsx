// Admin · Content tab — storefront content the web admin manages.
import React from "react";
import { ScrollView } from "react-native";
import {
  AdminTabBody,
  AdminTabHeader,
  MenuCard,
  type AdminMenuItem,
} from "./AdminTabParts";

export default function AdminContentTab({ navigation }: any) {
  const items: AdminMenuItem[] = [
    {
      key: "banners",
      label: "Banners",
      description: "Home slider images, links and order",
      icon: "images-outline",
      screen: "AdminBanners",
      tone: "#ec4899",
    },
    {
      key: "reviews",
      label: "Reviews",
      description: "Approve or hide customer reviews",
      icon: "star-outline",
      screen: "AdminReviews",
      tone: "#f59e0b",
    },
    {
      key: "blog",
      label: "Blog",
      description: "Posts and categories for exam guides",
      icon: "document-text-outline",
      screen: "AdminBlog",
      tone: "#0ea5e9",
    },
  ];

  return (
    <AdminTabBody>
      <AdminTabHeader title="Content" subtitle="Storefront & marketing" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <MenuCard items={items} onOpen={(i) => navigation.navigate(i.screen)} />
      </ScrollView>
    </AdminTabBody>
  );
}
