import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaDownload,
  FaBookOpen,
  FaReceipt,
} from "react-icons/fa";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import { ordersService } from "@/services/orders";
import { formatINR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function OrderSuccess() {
  const { orderNumber = "" } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => ordersService.detail(orderNumber),
  });

  async function downloadInvoice() {
    try {
      const blob = await ordersService.downloadInvoice(orderNumber);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order?.invoice_number || orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Invoice is available once the order is paid.");
    }
  }

  if (isLoading) {
    return (
      <div className="container-app py-16">
        <Skeleton className="mx-auto h-64 w-full max-w-lg" />
      </div>
    );
  }

  const paid = order?.status === "paid";
  const pendingVerification = order?.status === "pending_verification";

  return (
    <div className="container-app py-12">
      <Seo title="Order Confirmation" noindex />
      <div className="mx-auto max-w-lg text-center">
        {paid ? (
          <FaCheckCircle className="mx-auto h-20 w-20 text-emerald-500" />
        ) : (
          <FaHourglassHalf className="mx-auto h-20 w-20 text-amber-500" />
        )}

        <h1 className="mt-4 text-2xl font-bold">
          {paid
            ? "Payment Successful! 🎉"
            : pendingVerification
              ? "Order placed — verifying payment"
              : "Order placed"}
        </h1>

        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {paid
            ? "Your study material is unlocked and ready in My Library."
            : pendingVerification
              ? "We have received your payment details. Access unlocks as soon as our team verifies it (usually within a few hours)."
              : "Your order has been created."}
        </p>

        {order && (
          <div className="card mt-6 p-5 text-left">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-500">Order Number</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between border-b py-3">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold">{formatINR(order.total_amount)}</span>
            </div>
            <div className="flex justify-between border-b py-3">
              <span className="text-gray-500">Payment method</span>
              <span className="font-medium">
                {order.payment_method_display}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-gray-500">Items</span>
              <span className="font-medium">{order.total_items}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {paid && (
            <Link to="/library" className="btn-primary">
              <FaBookOpen /> Go to My Library
            </Link>
          )}
          <Link to="/orders" className="btn-outline">
            View My Orders
          </Link>
          {paid && (
            <button className="btn-ghost" onClick={downloadInvoice}>
              <FaDownload /> Invoice
            </button>
          )}
        </div>

        <Link to="/shop" className="link mt-6 inline-block text-sm">
          Continue shopping →
        </Link>
      </div>
    </div>
  );
}
