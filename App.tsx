import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from './context/CartContext';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import SearchPage from './pages/SearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import BulkOrderPage from './pages/BulkOrderPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PolicyPage from './pages/PolicyPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ThankYouPage from './pages/ThankYouPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import LaunchRoadmapPage from './pages/LaunchRoadmapPage';
import ProductResearchPage from './pages/ProductResearchPage';


import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ReviewsProvider } from './context/ReviewsContext';

import AdminLayout from './components/admin/AdminLayout';
import RequirePermission from './components/admin/RequirePermission';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductEditorPage from './pages/admin/AdminProductEditorPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage';
import AdminPrescriptionsPage from './pages/admin/AdminPrescriptionsPage';
import AdminPrescriptionDetailPage from './pages/admin/AdminPrescriptionDetailPage';
import AdminDiscountsPage from './pages/admin/AdminDiscountsPage';
import AdminShippingPage from './pages/admin/AdminShippingPage';
import AdminTaxPage from './pages/admin/AdminTaxPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Deterministic indexed catalogue bot plus direct human support controls.
import SupportCenter from './components/SupportCenter';

const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  if (pathname === '/roadmap' || pathname === '/launch-roadmap') {
    return <LaunchRoadmapPage />;
  }

  if (pathname === '/research' || pathname === '/product-research') {
    return <ProductResearchPage />;
  }

  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <AdminLayout>
          <Routes>
            <Route path="/admin" element={<RequirePermission permission="dashboard:view" resourceTitle="Operations Dashboard"><AdminDashboardPage /></RequirePermission>} />
            <Route path="/admin/roadmap" element={<RequirePermission permission="dashboard:view" resourceTitle="Launch Roadmap"><LaunchRoadmapPage /></RequirePermission>} />
            <Route path="/admin/research" element={<RequirePermission permission="products:view" resourceTitle="Product Margin Intelligence"><ProductResearchPage /></RequirePermission>} />
            <Route path="/admin/orders" element={<RequirePermission permission="orders:view" resourceTitle="Orders Directory"><AdminOrdersPage /></RequirePermission>} />
            <Route path="/admin/orders/:id" element={<RequirePermission permission="orders:view" resourceTitle="Order Details"><AdminOrderDetailPage /></RequirePermission>} />
            <Route path="/admin/products" element={<RequirePermission permission="products:view" resourceTitle="Catalog Management"><AdminProductsPage /></RequirePermission>} />
            <Route path="/admin/products/new" element={<RequirePermission permission="products:manage" resourceTitle="New Product Setup"><AdminProductEditorPage /></RequirePermission>} />
            <Route path="/admin/products/:id" element={<RequirePermission permission="products:manage" resourceTitle="Product Editor"><AdminProductEditorPage /></RequirePermission>} />
            <Route path="/admin/inventory" element={<RequirePermission permission="inventory:view" resourceTitle="Warehouse Inventory"><AdminInventoryPage /></RequirePermission>} />
            <Route path="/admin/customers" element={<RequirePermission permission="customers:view" resourceTitle="Customer Records"><AdminCustomersPage /></RequirePermission>} />
            <Route path="/admin/customers/:id" element={<RequirePermission permission="customers:view" resourceTitle="Customer Detail"><AdminCustomerDetailPage /></RequirePermission>} />
            <Route path="/admin/prescriptions" element={<RequirePermission permission="prescriptions:view" resourceTitle="Prescription Compliance"><AdminPrescriptionsPage /></RequirePermission>} />
            <Route path="/admin/prescriptions/:id" element={<RequirePermission permission="prescriptions:view" resourceTitle="Prescription Verification"><AdminPrescriptionDetailPage /></RequirePermission>} />
            <Route path="/admin/discounts" element={<RequirePermission permission="discounts:view" resourceTitle="Discounts & Coupons"><AdminDiscountsPage /></RequirePermission>} />
            <Route path="/admin/shipping" element={<RequirePermission permission="shipping:view" resourceTitle="Shipping Configuration"><AdminShippingPage /></RequirePermission>} />
            <Route path="/admin/tax" element={<RequirePermission permission="tax:view" resourceTitle="Tax Jurisdiction Settings"><AdminTaxPage /></RequirePermission>} />
            <Route path="/admin/analytics" element={<RequirePermission permission="analytics:view" resourceTitle="Analytics & Reports"><AdminAnalyticsPage /></RequirePermission>} />
            <Route path="/admin/audit-logs" element={<RequirePermission permission="audit_logs:view" resourceTitle="HIPAA Audit Logs"><AdminAuditLogsPage /></RequirePermission>} />
            <Route path="/admin/settings" element={<RequirePermission permission="settings:view" resourceTitle="Platform Settings"><AdminSettingsPage /></RequirePermission>} />
            <Route path="/admin/settings/users" element={<RequirePermission permission="staff:manage" resourceTitle="Staff Management"><AdminStaffPage /></RequirePermission>} />
            <Route path="/admin/settings/roles" element={<RequirePermission permission="roles:view" resourceTitle="RBAC Role Definitions"><AdminRolesPage /></RequirePermission>} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Routes>
        </AdminLayout>
      </AdminAuthProvider>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-white flex flex-col relative">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/guides/oxygen-concentrator-rental-guide" element={<Navigate to="/products?category=Oxygen%20Concentrator" replace />} />
          <Route path="/guides/bipap-machine-rental-guide" element={<Navigate to="/products?category=BiPAP" replace />} />
          <Route path="/guides/patient-monitor-guide" element={<Navigate to="/products?category=Patient%20Monitor" replace />} />
          <Route path="/guides/oxygen-concentrator-rental-hyderabad" element={<Navigate to="/products?category=Oxygen%20Concentrator" replace />} />

          <Route path="/oxygen-concentrator-rental-hyderabad" element={<Navigate to="/products?category=Oxygen%20Concentrator" replace />} />
          <Route path="/bipap-machine-on-rent-hyderabad" element={<Navigate to="/products?category=BiPAP" replace />} />
          <Route path="/patient-monitor-price-hyderabad" element={<Navigate to="/products?category=Patient%20Monitor" replace />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/bulk-orders" element={<BulkOrderPage />} />
          <Route path="/bulk-order" element={<BulkOrderPage />} />
          <Route path="/policies/privacy" element={<PolicyPage type="privacy" />} />
          <Route path="/policies/terms" element={<PolicyPage type="terms" />} />
          <Route path="/policies/shipping" element={<PolicyPage type="shipping" />} />
          <Route path="/policies/returns" element={<PolicyPage type="returns" />} />
          <Route path="/policy" element={<PolicyPage type="privacy" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      
      {/* Unified Support Experience */}
      <SupportCenter />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ReviewsProvider>
        <CartProvider>
          <Router>
            <ScrollToTopOnMount />
            <AppContent />
          </Router>
        </CartProvider>
      </ReviewsProvider>
    </AuthProvider>
  );
}

export default App;
