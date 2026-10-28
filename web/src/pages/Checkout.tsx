import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  FaCreditCard,
  FaQrcode,
  FaTag,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState } from "@/components/ui";
import { ordersService, paymentsService } from "@/services/orders";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/store/auth";
import { useAuthGate } from "@/store/authGate";
import { apiError } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { ManualQRData, PaymentMethod } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const openGate = useAuthGate((s) => s.open);
  const { cart, itemCount } = useCart();

  const [method, setMethod] = useState<PaymentMethod>("razorpay");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: string;
  } | null>(null);
  const [manualData, setManualData] = useState<ManualQRData | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | undefined>();
  const [processing, setProcessing] = useState(false);

  const applyCoupon = useMutation({
    mutationFn: () => ordersService.applyCoupon(coupon.trim()),
    onSuccess: (data) => {
      setAppliedCoupon({
        code: data.code,
        discount_amount: data.discount_amount,
      });
      toast.success(
        `Coupon applied — you save ${formatINR(data.discount_amount)}`,
      );
    },
    onError: (e) => {
      setAppliedCoupon(null);
      toast.error(apiError(e));
    },
  });

  // Submit UTR + screenshot for a manual-QR order. Declared here (not after the
  // early returns below) so the hook order never changes between renders —
  // otherwise React throws "Rendered more hooks than during the previous
  // render" and the whole checkout page goes blank.
  const confirmManual = useMutation({
    mutationFn: () =>
      ordersService.submitManualPayment(
        manualData!.order_number,
        utr.trim(),
        screenshot,
      ),
    onSuccess: () => {
      toast.success("Submitted! We will verify your payment shortly.");
      navigate(`/order-success/${manualData!.order_number}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  // Checkout is account-only — ask for login with the same dialog used by
  // cart / wishlist instead of dumping the visitor on an empty-cart page.
  if (!user) {
    return (
      <div className="container-app py-16">
        <Seo title="Checkout" noindex />
        <EmptyState
          title="Please log in first"
          message="Log in to complete your purchase and unlock your downloads instantly."
          action={
            <button className="btn-primary" onClick={() => openGate("buy")}>
              Log in to checkout
            </button>
          }
        />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="container-app py-16">
        <Seo title="Checkout" noindex />
        <EmptyState
          title="Your cart is empty"
          message="Add items before checking out."
          action={
            <button className="btn-primary" onClick={() => navigate("/shop")}>
              Browse Products
            </button>
          }
        />
      </div>
    );
  }

  const subtotal = parseFloat(cart.subtotal);
  const discount = appliedCoupon
    ? parseFloat(appliedCoupon.discount_amount)
    : 0;
  const payable = Math.max(subtotal - discount, 0);

  async function loadRazorpayScript() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function payWithRazorpay() {
    setProcessing(true);
    try {
      // 1. Create the order server-side.
      const order = await ordersService.checkout({
        payment_method: "razorpay",
        coupon_code: appliedCoupon?.code,
        customer_name: user?.name,
        customer_email: user?.email,
        customer_phone: user?.phone,
      });

      // 2. Create the Razorpay gateway order.
      const checkoutData = await paymentsService.razorpayCreate(
        order.order_number,
      );

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        toast.error("Could not load Razorpay. Check your connection.");
        setProcessing(false);
        return;
      }

      // 3. Open the Razorpay checkout.
      const rzp = new window.Razorpay({
        key: checkoutData.key_id,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: checkoutData.name,
        description: checkoutData.description,
        order_id: checkoutData.razorpay_order_id,
        prefill: checkoutData.prefill,
        theme: { color: "#2874f0" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4. Verify the signature server-side — this is what unlocks the order.
          try {
            await paymentsService.razorpayVerify({
              order_number: order.order_number,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            navigate(`/order-success/${order.order_number}`);
          } catch (err) {
            toast.error(apiError(err));
            navigate(`/orders/${order.order_number}`);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast("Payment cancelled", { icon: "⚠️" });
          },
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(apiError(e));
      setProcessing(false);
    }
  }

  async function startManualPayment() {
    setProcessing(true);
    try {
      const order = await ordersService.checkout({
        payment_method: "manual_qr",
        coupon_code: appliedCoupon?.code,
        customer_name: user?.name,
        customer_email: user?.email,
        customer_phone: user?.phone,
      });
      const details = await paymentsService.manualDetails(order.order_number);
      setManualData(details);
      toast.success("Order created — scan the QR to pay");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="container-app py-6">
      <Seo title="Checkout" noindex />
      <div className="mb-6">
        <p className="store-eyebrow mb-1">Secure checkout</p>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
          Checkout
        </h1>
        <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
          Instant delivery to your email and library after payment.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-5 lg:col-span-2">
          {/* Contact */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <h2 className="mb-3.5 text-[13.5px] font-bold text-slate-900 dark:text-white">
              Contact details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" value={user?.name || ""} readOnly />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={user?.email || ""} readOnly />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Phone</label>
                <input className="input" value={user?.phone || "—"} readOnly />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Update these in your profile. Purchased material is delivered to
              this email.
            </p>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <h2 className="mb-3.5 text-[13.5px] font-bold text-slate-900 dark:text-white">
              Payment method
            </h2>
            <div className="space-y-3">
              <MethodOption
                active={method === "razorpay"}
                onClick={() => setMethod("razorpay")}
                icon={<FaCreditCard className="h-5 w-5" />}
                title="Pay Online (Razorpay)"
                desc="UPI, Cards, Netbanking, Wallets — instant access after payment"
              />
              <MethodOption
                active={method === "manual_qr"}
                onClick={() => setMethod("manual_qr")}
                icon={<FaQrcode className="h-5 w-5" />}
                title="Pay via UPI / QR"
                desc="Scan our QR, pay, then submit your UTR for verification"
              />
            </div>
          </div>

          {/* Manual QR panel */}
          {manualData && method === "manual_qr" && (
            <div className="rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-amber-400/40 dark:bg-[#0e1526]">
              <h2 className="mb-3.5 text-[13.5px] font-bold text-slate-900 dark:text-white">
                Complete your UPI payment
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="text-center">
                  {manualData.upi_qr_image ? (
                    <img
                      src={manualData.upi_qr_image}
                      alt="UPI QR"
                      className="mx-auto w-56 rounded-lg border"
                    />
                  ) : (
                    <div className="mx-auto grid h-56 w-56 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[12px] text-slate-400 dark:border-white/15 dark:bg-white/[0.03]">
                      QR not configured — contact support
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Scan with any UPI app
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Pay exactly this amount:
                  </p>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                    {formatINR(manualData.amount)}
                  </p>
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    <p>
                      <span className="text-gray-500">Order ID:</span>{" "}
                      <strong>{manualData.order_number}</strong>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Add this in the payment note if your app allows.
                    </p>
                  </div>
                  {manualData.whatsapp_link && (
                    <a
                      href={manualData.whatsapp_link}
                      target="_blank"
                      rel="noreferrer"
                      className="link mt-3 inline-block text-sm"
                    >
                      Need help? Chat on WhatsApp →
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t pt-4">
                <div>
                  <label className="label">
                    UTR / Transaction ID{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="input"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="e.g. 123456789012"
                  />
                </div>
                <div>
                  <label className="label">
                    Payment screenshot (optional but speeds verification)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0])}
                    className="input file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
                  />
                </div>
                <button
                  className="btn-primary w-full py-3"
                  disabled={!utr.trim() || confirmManual.isPending}
                  onClick={() => confirmManual.mutate()}
                >
                  {confirmManual.isPending ? (
                    <>
                      <FaSpinner className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <FaCheck /> I have paid — Submit for verification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-34px_rgba(15,23,42,0.35)] lg:sticky lg:top-[132px] dark:border-white/[0.07] dark:bg-[#0e1526]">
            <h2 className="mb-4 text-[13.5px] font-bold text-slate-900 dark:text-white">
              Order summary
            </h2>

            <div className="max-h-48 space-y-2 overflow-auto pr-1">
              {cart.items.map((i) => (
                <div key={i.id} className="flex justify-between gap-2 text-sm">
                  <span className="line-clamp-2 text-gray-600 dark:text-gray-300">
                    {i.product.title}
                  </span>
                  <span className="shrink-0 font-medium">×{i.quantity}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-4 border-t pt-4">
              <label className="label flex items-center gap-1">
                <FaTag /> Have a coupon?
              </label>
              <div className="flex gap-2">
                <input
                  className="input"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                />
                <button
                  className="btn-outline shrink-0"
                  disabled={!coupon.trim() || applyCoupon.isPending}
                  onClick={() => applyCoupon.mutate()}
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <FaCheck /> {appliedCoupon.code} applied
                </p>
              )}
            </div>

            {/* Totals */}
            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal ({itemCount} items)</dt>
                <dd>{formatINR(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Coupon discount</dt>
                  <dd>− {formatINR(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>Total Payable</dt>
                <dd>{formatINR(payable)}</dd>
              </div>
            </dl>

            {method === "razorpay" ? (
              <button
                className="btn-primary mt-5 w-full py-3"
                disabled={processing}
                onClick={payWithRazorpay}
              >
                {processing ? (
                  <>
                    <FaSpinner className="animate-spin" /> Processing…
                  </>
                ) : (
                  `Pay ${formatINR(payable)}`
                )}
              </button>
            ) : !manualData ? (
              <button
                className="btn-accent mt-5 w-full py-3"
                disabled={processing}
                onClick={startManualPayment}
              >
                {processing ? (
                  <>
                    <FaSpinner className="animate-spin" /> Creating order…
                  </>
                ) : (
                  "Show QR & Pay"
                )}
              </button>
            ) : null}

            <p className="mt-3 text-center text-xs text-gray-400">
              🔒 Secure checkout. Material unlocks instantly after payment
              verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
        active
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
          : "border-gray-200 hover:border-brand-300 dark:border-gray-700"
      }`}
    >
      <span className={`mt-0.5 ${active ? "text-brand-600" : "text-gray-400"}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2 font-semibold">
          {title}
          {active && <FaCheck className="h-3.5 w-3.5 text-brand-600" />}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">{desc}</span>
      </span>
    </button>
  );
}
