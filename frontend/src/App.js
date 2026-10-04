import { useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
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
        {view === "home" && <HomeView />}
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

  const modals = { setCommentReel, setSellerId, setOrderReel, setShowLogin, setShowLegal };

  return (
    <div className="min-h-screen bg-brand-cream md:bg-slate-900">
      <div className="md:flex md:min-h-screen md:justify-center md:items-start md:gap-6 md:p-6">
        <LeftSidebar onLegal={() => setShowLegal(true)} />
        <div className="h-[100dvh] w-full bg-black md:h-[88vh] md:w-full md:max-w-[420px] md:rounded-[2rem] md:overflow-hidden md:shadow-[0_0_60px_rgba(0,0,0,0.6)] md:border-[6px] md:border-slate-800 md:shrink-0">
          <Screen modals={modals} />
        </div>
        <RightSidebar />
      </div>

      {/* Modals */}
      {commentReel && <CommentDrawer reel={commentReel} onClose={() => setCommentReel(null)} />}
      {sellerId && <SellerProfileModal sellerId={sellerId} onClose={() => setSellerId(null)} onOrder={setOrderReel} />}
      {orderReel && <OrderModal reel={orderReel} onClose={() => setOrderReel(null)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
    </div>
  );
}

function AdminPortalPage() {
  const navigate = useNavigate();
  return <AdminDashboard onClose={() => navigate("/")} />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shell />} />
          <Route path="/admin-secret-portal" element={<AdminPortalPage />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
