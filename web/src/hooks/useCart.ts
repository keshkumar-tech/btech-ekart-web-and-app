// Cart hook: server cart when logged in, localStorage guest cart otherwise.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/store/auth";
import { useAuthGate } from "@/store/authGate";
import { cartService } from "@/services/cart";
import { apiError } from "@/lib/api";
import type { Cart, Product } from "@/types";

export function useCart() {
  const { isAuthenticated } = useAuth();
  const openGate = useAuthGate((s) => s.open);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cart", isAuthenticated],
    queryFn: cartService.get,
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  // Cart is account-only now, so a signed-out visitor always sees 0.
  const itemCount = isAuthenticated ? (query.data?.item_count ?? 0) : 0;

  const addMutation = useMutation({
    // Only reached once signed in — see the guarded `addToCart` below.
    mutationFn: async (product: Product) => cartService.add(product.id, 1),
    onSuccess: (data) => {
      if (isAuthenticated) qc.setQueryData(["cart", true], data as Cart);
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart 🛒");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  // Guarded entry point used by every storefront surface.
  const addToCart = (product: Product) => {
    if (!isAuthenticated) {
      openGate("cart");
      return;
    }
    addMutation.mutate(product);
  };

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartService.updateQty(itemId, quantity),
    onSuccess: (data) => qc.setQueryData(["cart", true], data),
    onError: (e) => toast.error(apiError(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartService.remove(itemId),
    onSuccess: (data) => {
      qc.setQueryData(["cart", true], data);
      toast.success("Removed from cart");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const clearMutation = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: (data) => qc.setQueryData(["cart", true], data),
  });

  // True when this product is already in the user's cart — drives the
  // "Go to cart" state on product cards and the detail page.
  const inCart = (productId?: number) =>
    !!productId &&
    !!query.data?.items?.some((i) => i.product.id === productId);

  return {
    cart: query.data,
    isLoading: query.isLoading,
    itemCount,
    addToCart,
    inCart,
    updateQty: updateMutation.mutate,
    removeItem: removeMutation.mutate,
    clearCart: clearMutation.mutate,
    isAdding: addMutation.isPending,
  };
}
