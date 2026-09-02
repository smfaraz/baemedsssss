import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from './context/CartContext';
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
import OxygenRentalGuidePage from './pages/OxygenRentalGuidePage';
import BipapRentalHyderabadPage from './pages/BipapRentalHyderabadPage';
import PatientMonitorHyderabadPage from './pages/PatientMonitorHyderabadPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ReviewsProvider } from './context/ReviewsContext';

// Deterministic indexed catalogue bot plus direct human support controls.
import SupportCenter from './components/SupportCenter';

const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <AuthProvider>
      <ReviewsProvider>
        <CartProvider>
          <Router>
            <ScrollToTopOnMount />
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
                <Route path="/bulk-orders" element={<BulkOrderPage />} />
                <Route path="/guides/oxygen-concentrator-rental-hyderabad" element={<OxygenRentalGuidePage />} />
                <Route path="/oxygen-concentrator-rental-hyderabad" element={<OxygenRentalGuidePage />} />
                <Route path="/bipap-machine-on-rent-hyderabad" element={<BipapRentalHyderabadPage />} />
                <Route path="/patient-monitor-price-hyderabad" element={<PatientMonitorHyderabadPage />} />
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
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            
            {/* Unified Support Experience */}
            <SupportCenter />
            
          </div>
        </Router>
      </CartProvider>
    </ReviewsProvider>
  </AuthProvider>
  );
}

export default App;
