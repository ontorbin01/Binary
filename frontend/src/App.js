import { useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "@/context/AppContext";
import HomeView from "@/components/HomeView";
import ReelsFeed from "@/components/ReelsFeed";
import CategoriesView from "@/components/CategoriesView";
import CartView from "@/components/CartView";
import ProfileView from "@/components/ProfileView";
import BottomNav from "@/components/BottomNav";
import { LeftSidebar, RightSidebar } from "@/components/DesktopSidebars";
import CommentDrawer from "@/components/CommentDrawer";
import SellerProfileModal from "@/components/SellerProfileModal";
import OrderModal from "@/components/OrderModal";
import LoginModal from "@/components/LoginModal";
import LegalModal from "@/components/LegalModal";
import AdminDashboard from "@/components/AdminDashboard";

function Screen({ modals }) {
  const { view } = useApp();
  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <div className="h-full w-full">
        {view === "home" && <HomeView onAdmin={() => modals.setShowAdmin(true)} />}
        {view === "feed" && (
          <ReelsFeed
            onOpenComments={modals.setCommentReel}
            onOpenSeller={modals.setSellerId}
            onOrder={modals.setOrderReel}
          />
        )}
        {view === "categories" && <CategoriesView />}
        {view === "cart" && <CartView onOrder={modals.setOrderReel} />}
        {view === "profile" && <ProfileView onLogin={() => modals.setShowLogin(true)} onLegal={() => modals.setShowLegal(true)} />}
      </div>
      <BottomNav />
    </div>
  );
}

function Shell() {
  const [commentReel, setCommentReel] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [orderReel, setOrderReel] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const modals = { setCommentReel, setSellerId, setOrderReel, setShowLogin, setShowLegal, setShowAdmin };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Mobile */}
      <div className="md:hidden h-[100dvh] w-full">
        <Screen modals={modals} />
      </div>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen bg-slate-900 justify-center items-start gap-6 p-6">
        <LeftSidebar onLegal={() => setShowLegal(true)} />
        <div className="w-full max-w-[420px] h-[88vh] rounded-[2rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)] border-[6px] border-slate-800 bg-black shrink-0">
          <Screen modals={modals} />
        </div>
        <RightSidebar onAdmin={() => setShowAdmin(true)} />
      </div>

      {/* Modals */}
      {commentReel && <CommentDrawer reel={commentReel} onClose={() => setCommentReel(null)} />}
      {sellerId && <SellerProfileModal sellerId={sellerId} onClose={() => setSellerId(null)} onOrder={setOrderReel} />}
      {orderReel && <OrderModal reel={orderReel} onClose={() => setOrderReel(null)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default App;
