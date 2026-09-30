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


import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ReviewsProvider } from './context/ReviewsContext';

import AdminLayout from './components/admin/AdminLayout';
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

  if (isAdminRoute) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/roadmap" element={<LaunchRoadmapPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/new" element={<AdminProductEditorPage />} />
          <Route path="/admin/products/:id" element={<AdminProductEditorPage />} />
          <Route path="/admin/inventory" element={<AdminInventoryPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="/admin/prescriptions" element={<AdminPrescriptionsPage />} />
          <Route path="/admin/prescriptions/:id" element={<AdminPrescriptionDetailPage />} />
          <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
          <Route path="/admin/shipping" element={<AdminShippingPage />} />
          <Route path="/admin/tax" element={<AdminTaxPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/settings/users" element={<AdminStaffPage />} />
          <Route path="/admin/settings/roles" element={<AdminRolesPage />} />
          <Route path="*" element={<AdminDashboardPage />} />
        </Routes>
      </AdminLayout>
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
