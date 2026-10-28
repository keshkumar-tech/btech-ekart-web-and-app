// Wishlist hook: server wishlist when logged in, localStorage otherwise.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/store/auth";
import { useAuthGate } from "@/store/authGate";
import { wishlistService } from "@/services/cart";
import { apiError } from "@/lib/api";
import type { Product, Wishlist } from "@/types";

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const openGate = useAuthGate((s) => s.open);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist", isAuthenticated],
    queryFn: wishlistService.get,
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const itemCount = isAuthenticated ? (query.data?.item_count ?? 0) : 0;

  // Wishlist is account-only: signed-out visitors see nothing saved.
  const isWishlisted = (productId: number): boolean =>
    isAuthenticated
      ? !!query.data?.products.some((p) => p.id === productId)
      : false;

  const toggleMutation = useMutation({
    mutationFn: async (product: Product) => {
      const already = query.data?.products.some((p) => p.id === product.id);
      return already
        ? wishlistService.remove(product.id)
        : wishlistService.add(product.id);
    },
    onSuccess: (data, product) => {
      if (data) qc.setQueryData(["wishlist", true], data as Wishlist);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      const nowIn = !!(data as Wishlist)?.products?.some(
        (p) => p.id === product.id,
      );
      toast.success(nowIn ? "Saved to wishlist ❤️" : "Removed from wishlist");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  // Guests are asked to sign in first; nothing is written to a guest list.
  const toggleWishlist = (product: Product) => {
    if (!isAuthenticated) {
      openGate("wishlist");
      return;
    }
    toggleMutation.mutate(product);
  };

  const moveToCartMutation = useMutation({
    mutationFn: (productId: number) => wishlistService.moveToCart(productId),
    onSuccess: (data) => {
      qc.setQueryData(["wishlist", true], data);
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Moved to cart 🛒");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return {
    wishlist: query.data,
    isLoading: query.isLoading,
    itemCount,
    isWishlisted,
    toggleWishlist,
    moveToCart: moveToCartMutation.mutate,
  };
}
