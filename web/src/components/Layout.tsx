// Store layout: navbar + page outlet + footer + floating support.
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import LoginGate from "@/components/store/LoginGate";
import WelcomeOffer from "@/components/store/WelcomeOffer";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingSupport />
      {/* Global "please log in first" dialog for cart / wishlist actions. */}
      <LoginGate />
      {/* First-visit subscribe / get-in-touch popup. */}
      <WelcomeOffer />
    </div>
  );
}
