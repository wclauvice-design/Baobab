import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Payment } from './pages/Payment';
import { OrderHistory } from './pages/OrderHistory';
import { OrderDetail } from './pages/OrderDetail';
import { Account } from './pages/Account';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6 text-sm text-slate-500">Chargement…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  if (loading) return <div className="p-6 text-sm text-slate-500">Chargement…</div>;

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<RequireAuth><Catalog /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth><Catalog autoFocusSearch /></RequireAuth>} />
        <Route path="/products/:id" element={<RequireAuth><ProductDetail /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrderHistory /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
        <Route path="/orders/:id/payment" element={<RequireAuth><Payment /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
      </Routes>
      {!hideNav && user && <BottomNav />}
    </>
  );
}
