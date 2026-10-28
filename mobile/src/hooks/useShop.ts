// Cart + wishlist hooks. Everything is account-backed: the backend stores the
// cart/wishlist per user, so a signed-out visitor is asked to log in instead of
// keeping a local (and later invisible/lost) copy.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { cartService, wishlistService } from "@/services";
import { apiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import type { Cart, Product, Wishlist } from "@/types";

export function useCart() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.get,
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: (product: Product) => cartService.add(product.id, 1),
    onSuccess: (data) => {
      qc.setQueryData(["cart"], data as Cart);
      qc.invalidateQueries({ queryKey: ["cart"] });
      Toast.show({ type: "success", text1: "Added to cart" });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Could not add", text2: apiError(e) }),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartService.remove(itemId),
    onSuccess: (data) => qc.setQueryData(["cart"], data),
    onError: (e) =>
      Toast.show({ type: "error", text1: "Error", text2: apiError(e) }),
  });

  const updateMutation = useMutation({
    mutationFn: (p: { itemId: number; quantity: number }) =>
      cartService.updateQty(p.itemId, p.quantity),
    onSuccess: (data) => qc.setQueryData(["cart"], data),
  });

  const itemCount = isAuthenticated ? (query.data?.item_count ?? 0) : 0;

  // Product ids already in the cart — drives the "ADDED / Go to cart" button.
  const cartProductIds = new Set(
    (query.data?.items ?? []).map((i) => i.product.id),
  );

  return {
    cart: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    itemCount,
    count: itemCount,
    cartProductIds,
    inCart: (productId: number) => cartProductIds.has(productId),
    savings: query.data?.savings ?? query.data?.you_save ?? "0",
    addToCart: addMutation.mutate,
    removeItem: removeMutation.mutate,
    updateQty: updateMutation.mutate,
  };
}

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistService.get,
    enabled: isAuthenticated,
  });

  const toggleMutation = useMutation({
    mutationFn: (product: Product) => {
      const has = !!query.data?.products?.some((p) => p.id === product.id);
      return has
        ? wishlistService.remove(product.id)
        : wishlistService.add(product.id);
    },
    onSuccess: (data, product) => {
      const had = !!query.data?.products?.some((p) => p.id === product.id);
      qc.setQueryData(["wishlist"], data as Wishlist);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      Toast.show({
        type: "success",
        text1: had ? "Removed from wishlist" : "Saved to wishlist",
      });
    },
    onError: (e) =>
      Toast.show({
        type: "error",
        text1: "Wishlist error",
        text2: apiError(e),
      }),
  });

  const moveMutation = useMutation({
    mutationFn: (productId: number) => wishlistService.moveToCart(productId),
    onSuccess: (data) => {
      qc.setQueryData(["wishlist"], data);
      qc.invalidateQueries({ queryKey: ["cart"] });
      Toast.show({ type: "success", text1: "Moved to cart" });
    },
  });

  const products = query.data?.products ?? [];

  return {
    wishlist: query.data,
    isLoading: query.isLoading,
    itemCount: isAuthenticated ? products.length : 0,
    isWishlisted: (productId: number) =>
      !!products.some((p) => p.id === productId),
    toggleWishlist: toggleMutation.mutate,
    moveToCart: moveMutation.mutate,
  };
}
