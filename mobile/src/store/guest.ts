// Guest cart/wishlist for signed-out users, cached on-device with AsyncStorage.
// On login these are sent to the server, which merges them into the account.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "ekart_guest_cart";
const WISH_KEY = "ekart_guest_wishlist";

interface GuestItem {
  product_id: number;
}

let cacheCart: GuestItem[] = [];
let cacheWish: GuestItem[] = [];
let hydrated = false;

async function hydrate() {
  if (hydrated) return;
  try {
    const [c, w] = await Promise.all([
      AsyncStorage.getItem(CART_KEY),
      AsyncStorage.getItem(WISH_KEY),
    ]);
    cacheCart = c ? JSON.parse(c) : [];
    cacheWish = w ? JSON.parse(w) : [];
  } catch {
    cacheCart = [];
    cacheWish = [];
  }
  hydrated = true;
}

export const guestStore = {
  async init() {
    await hydrate();
  },
  getCart(): GuestItem[] {
    return cacheCart;
  },
  getWishlist(): GuestItem[] {
    return cacheWish;
  },
  async addToCart(productId: number) {
    await hydrate();
    if (!cacheCart.some((i) => i.product_id === productId)) {
      cacheCart = [...cacheCart, { product_id: productId }];
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cacheCart));
    }
  },
  async addToWishlist(productId: number) {
    await hydrate();
    if (!cacheWish.some((i) => i.product_id === productId)) {
      cacheWish = [...cacheWish, { product_id: productId }];
      await AsyncStorage.setItem(WISH_KEY, JSON.stringify(cacheWish));
    }
  },
  async toggleWishlist(productId: number): Promise<boolean> {
    await hydrate();
    const exists = cacheWish.some((i) => i.product_id === productId);
    cacheWish = exists
      ? cacheWish.filter((i) => i.product_id !== productId)
      : [...cacheWish, { product_id: productId }];
    await AsyncStorage.setItem(WISH_KEY, JSON.stringify(cacheWish));
    return !exists;
  },
  async clear() {
    cacheCart = [];
    cacheWish = [];
    await Promise.all([
      AsyncStorage.removeItem(CART_KEY),
      AsyncStorage.removeItem(WISH_KEY),
    ]);
  },
};
