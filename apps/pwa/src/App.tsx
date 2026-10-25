import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { PageLoader } from "./components/PageLoader";
import { Login } from "./pages/Login";
import { OrderHistory } from "./pages/OrderHistory";
import { OrderDetail } from "./pages/OrderDetail";
import { LegalTerms } from "./pages/LegalTerms";
import { LegalPrivacy } from "./pages/LegalPrivacy";
import {
  MarketShell,
  Marketplace,
  ListingDetail,
  Storefront,
  Inbox,
  Tracking,
  Purchases,
  MarketAccount,
} from "./pages/Marketplace";
function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  if (location.pathname === "/login")
    return user ? <Navigate to="/account" replace /> : <Login />;
  return (
    <MarketShell>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/search" element={<Marketplace />} />
        <Route path="/favorites" element={<Marketplace favorites />} />
        <Route path="/products/:id" element={<ListingDetail />} />
        <Route path="/shop/:id" element={<Storefront />} />
        <Route path="/store/:id" element={<Storefront />} />
        <Route path="/messages" element={<Inbox />} />
        <Route path="/messages/:id" element={<Inbox />} />
        <Route path="/tracking/:id" element={<Tracking />} />
        <Route
          path="/my-orders/:id"
          element={
            <RequireAuth>
              <Tracking account />
            </RequireAuth>
          }
        />
        <Route path="/orders" element={<Purchases />} />
        <Route path="/account" element={<MarketAccount />} />
        <Route
          path="/legacy-orders"
          element={
            <RequireAuth>
              <OrderHistory />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
        <Route path="/terms" element={<LegalTerms />} />
        <Route path="/privacy" element={<LegalPrivacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MarketShell>
  );
}
