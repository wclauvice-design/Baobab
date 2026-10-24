import { BusinessSettings } from "./pages/BusinessSettings";
import {
  Overview,
  TradeOrders,
  TradeDetail,
  Customers,
  OperationsInbox,
} from "./pages/Operations";
import { ListingEditor } from "./pages/ListingEditor";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { PaymentQueue } from "./pages/admin/PaymentQueue";
import { Sellers } from "./pages/admin/Sellers";
import { Catalog } from "./pages/admin/Catalog";
import { Orders as AdminOrders } from "./pages/admin/Orders";
import { Dashboard } from "./pages/seller/Dashboard";
import { Products } from "./pages/seller/Products";
import { Orders as SellerOrders } from "./pages/seller/Orders";

export default function App() {
  const { user, loading } = useAuth();

  if (loading)
    return <div className="p-6 text-sm text-slate-500">Chargement…</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/messages" element={<OperationsInbox />} />
          <Route path="/messages/:id" element={<OperationsInbox />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<BusinessSettings />} />
          <Route path="/orders/:id" element={<TradeDetail />} />
          <Route path="/legacy-payments" element={<PaymentQueue />} />
          <Route path="/legacy-orders" element={<AdminOrders />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/catalog" element={<ListingEditor />} />
          <Route path="/orders" element={<TradeOrders />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  if (user.role === "SELLER") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ListingEditor />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <div className="p-6 text-sm text-slate-500">
      Ce compte n'a pas accès au back-office. Connectez-vous avec un compte
      vendeur ou admin.
    </div>
  );
}
