// Login gate — a single place that decides whether an action needs an account.
//
// Buying, saving to the wishlist and checking out all require login. When a
// guest taps ADD / the heart, we do NOT store anything locally: the backend is
// the source of truth, so a "guest cart" would silently disappear after login.
// Instead we show a clear "Please log in first" dialog and send them to Login.
//
//   cart.requireLogin(navigation, "add to cart")  -> true when allowed
//   cart.requireLogin(navigation, "save to wishlist")
//
import { Alert } from "react-native";

export type GateAction =
  | "add to cart"
  | "save to wishlist"
  | "checkout"
  | "continue";

export function requireLogin(
  navigation: any,
  isAuthenticated: boolean,
  action: GateAction = "continue",
): boolean {
  if (isAuthenticated) return true;

  const messages: Record<GateAction, string> = {
    "add to cart": "Please log in first to add items to your cart.",
    "save to wishlist": "Please log in first to save items to your wishlist.",
    checkout: "Please log in first to place your order.",
    continue: "Please log in first to continue.",
  };

  Alert.alert("Login required", messages[action], [
    { text: "Not now", style: "cancel" },
    {
      text: "Log in",
      onPress: () => navigation.navigate("Login"),
    },
  ]);
  return false;
}
