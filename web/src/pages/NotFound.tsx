import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import Seo from "@/components/Seo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Seo title="Page not found" noindex />
      <div className="text-center">
        <FaExclamationTriangle className="mx-auto h-16 w-16 text-amber-400" />
        <h1 className="mt-4 text-6xl font-black text-gray-900 dark:text-gray-100">
          404
        </h1>
        <p className="mt-2 text-lg font-semibold">Page not found</p>
        <p className="mt-1 text-sm text-gray-500">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/shop" className="btn-outline">
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
