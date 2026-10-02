import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '../types';
import { 
  createShopifyCart, 
  fetchShopifyCart, 
  addItemToCart, 
  removeLineItemFromCart, 
  updateLineItemInCart,
  attachCustomerToCart,
  formatCartResponse,
} from '../lib/commerce';
import { useAuth } from './AuthContext';


// --- Router Shim for missing react-router-dom ---
const RouterContext = createContext<{ path: string; search: string; navigate: (to: string) => void } | undefined>(undefined);
const RouteParamsContext = createContext<Record<string, string>>({});

export const BrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);

  useEffect(() => {
    const handler = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setPath(window.location.pathname);
    setSearch(window.location.search);
    window.scrollTo(0, 0);
  };

  return <RouterContext.Provider value={{ path, search, navigate }}>{children}</RouterContext.Provider>;
};

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useContext(RouterContext)!;
  const currentPath = decodeURIComponent(path);

  let matchedElement: React.ReactNode | null = null;
  let fallbackElement: React.ReactNode | null = null;
  let matchedParams = {};

  const childrenArray = React.Children.toArray(children);

  for (const child of childrenArray) {
    if (!React.isValidElement(child)) continue;
    
    const props = child.props as { path?: string; element?: React.ReactNode };
    const routePath = props.path;
    const element = props.element;

    if (!routePath || !element) continue;

    if (routePath === '*') {
      fallbackElement = element;
      continue;
    }

    if (routePath === currentPath || (routePath !== '/' && currentPath === `${routePath}/`)) {
      matchedElement = element;
      break; 
    }

    if (routePath.includes('/:')) {
      const [base, paramName] = routePath.split('/:');
      const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const regex = new RegExp(`^${cleanBase}/(.+)/?$`);
      
      const match = currentPath.match(regex);
      if (match) {
        matchedElement = element;
        matchedParams = { [paramName]: match[1] };
        break; 
      }
    }
  }

  if (!matchedElement && fallbackElement) {
    matchedElement = fallbackElement;
  }

  if (!matchedElement) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <h2 className="text-4xl font-bold text-gray-200 mb-4">404</h2>
            <p className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</p>
            <p className="text-gray-500 mb-6">The page you are looking for ({currentPath}) does not exist.</p>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="px-6 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-dark transition-colors">
                Back to Home
            </a>
        </div>
    );
  }

  return <RouteParamsContext.Provider value={matchedParams}>{matchedElement}</RouteParamsContext.Provider>;
};

export const Route: React.FC<{ path: string; element: React.ReactNode }> = ({ element }) => <>{element}</>;

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to }) => {
  const router = useContext(RouterContext);
  useEffect(() => {
    if (router) router.navigate(to);
  }, [to, router]);
  return null;
};


type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
};

export const Link: React.FC<LinkProps> = ({ to, children, onClick, ...anchorProps }) => {
  const { navigate } = useContext(RouterContext)!;
  return (
    <a href={to} {...anchorProps} onClick={(e) => {
      if (
        e.button !== 0
        || e.metaKey
        || e.ctrlKey
        || e.shiftKey
        || e.altKey
        || anchorProps.target === '_blank'
      ) return;
      e.preventDefault();
      if (onClick) onClick(e);
      navigate(to);
    }}>{children}</a>
  );
};

export const useNavigate = () => {
  const { navigate } = useContext(RouterContext)!;
  return navigate;
};

export const useLocation = () => {
  const { path, search } = useContext(RouterContext)!;
  return { pathname: path, search };
};

export const useParams = <T extends Record<string, string>>() => {
  return useContext(RouteParamsContext) as T;
};

export const useSearchParams = () => {
   const { search, navigate } = useContext(RouterContext)!;
   const [params, setParams] = useState(new URLSearchParams(search));
   
   useEffect(() => {
     setParams(new URLSearchParams(search));
   }, [search]);

   const setSearchParams = (newParams: any) => {
      const q = new URLSearchParams(newParams).toString();
      navigate(window.location.pathname + '?' + q);
   };
   return [params, setSearchParams] as const;
};
// ------------------------------------------------

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (lineItemId: string) => Promise<void>;
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  syncCartWithCustomer: () => Promise<string | null>;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  checkoutUrl: string | null;
  isLoading: boolean;
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customer } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Keep the cart in a loading state until the persisted Shopify cart has been hydrated.
  // This prevents the empty-cart screen flashing on refresh while the cart request is pending.
  const [isLoading, setIsLoading] = useState(true);

  const syncCartWithCustomer = useCallback(async () => {
     const currentCartId = cartId || localStorage.getItem('shopify_cart_id');
     if (!currentCartId) return null;
     
     try {
       const updatedCart = await attachCustomerToCart(currentCartId);
       if (updatedCart) {
          setCheckoutUrl(updatedCart.checkoutUrl);
          updateLocalCart(updatedCart.lines);
          return updatedCart.checkoutUrl || null;
       }
     } catch (e) {
       console.error("Manual sync failed", e);
     }
     return null;
  }, [cartId]);

  // Sync with customer whenever login state changes or cartId is available
  useEffect(() => {
    if (customer && cartId) {
      syncCartWithCustomer();
    }
  }, [customer, cartId, syncCartWithCustomer]);

  // Initialize Cart and Wishlist natively
  useEffect(() => {
    const initCart = () => {
      setIsLoading(true);
      let existingCartId = localStorage.getItem('shopify_cart_id') || localStorage.getItem('cartId');
      if (!existingCartId) {
        existingCartId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('shopify_cart_id', existingCartId);
        localStorage.setItem('cartId', existingCartId);
      }
      setCartId(existingCartId);
      setCheckoutUrl('/checkout');

      // 1. Load Wishlist from LocalStorage
      const savedWishlist = localStorage.getItem('mediequip_wishlist');
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch (e) {
          console.error("Error parsing wishlist", e);
        }
      }

      // 2. Load Cart from LocalStorage
      try {
        const savedCart = localStorage.getItem('baemeds_native_cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: Check legacy cart format
        const rawLegacy = localStorage.getItem(`baemeds_cart_${existingCartId}`);
        if (rawLegacy) {
          const parsedLegacy = JSON.parse(rawLegacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const formatted = formatCartResponse(existingCartId);
            updateLocalCart(formatted.lines);
          }
        }
      } catch (e) {
        console.warn("Cart initialization fallback:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initCart();
  }, []);

  // Save Wishlist when it changes
  useEffect(() => {
    localStorage.setItem('mediequip_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const updateLocalCart = (lines: any) => {
    if (!lines || !lines.edges) return;
    
    const mappedItems: CartItem[] = lines.edges
      .filter((edge: any) => edge && edge.node && edge.node.merchandise)
      .map((edge: any) => {
        const item = edge.node;
        const merchandise = item.merchandise;
        const productInfo = merchandise.product || {};
        
        return {
          id: productInfo.id || merchandise.id || item.id,
          handle: productInfo.handle || '',
          title: productInfo.title || 'Medical Supply',
          vendor: /mohsin/i.test(productInfo.vendor || '') ? 'BaeMeds' : (productInfo.vendor || 'BaeMeds'),
          category: "Product", 
          price: parseFloat(merchandise.price?.amount || '0'),
          compareAtPrice: null,
          image: merchandise.image?.url || '',
          images: [merchandise.image?.url || ''],
          tags: [],
          specs: merchandise.title === 'Default Title' ? '' : (merchandise.title || ''),
          inStock: true,
          quantity: item.quantity || 1,
          lineItemId: item.id,
          variantId: merchandise.id || productInfo.id
        };
      });
    setCart(mappedItems);
    localStorage.setItem('baemeds_native_cart', JSON.stringify(mappedItems));
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!product) return;
    setIsLoading(true);

    try {
      let currentCartId = cartId || localStorage.getItem('shopify_cart_id') || localStorage.getItem('cartId');
      if (!currentCartId) {
        currentCartId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('shopify_cart_id', currentCartId);
        localStorage.setItem('cartId', currentCartId);
        setCartId(currentCartId);
      }
      setCheckoutUrl('/checkout');

      const targetVariantId = product.variantId || `var-${product.id}`;
      const lineItemId = `line_${product.id}_${Date.now()}`;

      setCart((prevCart) => {
        const existingIdx = prevCart.findIndex((i) => i.id === product.id || i.variantId === targetVariantId || i.handle === product.handle);
        let nextCart: CartItem[];
        if (existingIdx > -1) {
          nextCart = [...prevCart];
          nextCart[existingIdx] = {
            ...nextCart[existingIdx],
            quantity: nextCart[existingIdx].quantity + quantity,
          };
        } else {
          const newItem: CartItem = {
            id: product.id,
            handle: product.handle,
            title: product.title,
            vendor: /mohsin/i.test(product.vendor || '') ? 'BaeMeds' : (product.vendor || 'BaeMeds'),
            category: product.category || 'Product',
            price: Number(product.price) || 0,
            compareAtPrice: product.compareAtPrice || null,
            image: product.image || (product.images && product.images[0]) || '',
            images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || ''],
            tags: product.tags || [],
            specs: product.specs || '',
            inStock: true,
            quantity: quantity,
            lineItemId: lineItemId,
            variantId: targetVariantId,
            prescriptionRequired: Boolean(product.prescriptionRequired || product.requiresPrescription),
          };
          nextCart = [...prevCart, newItem];
        }
        localStorage.setItem('baemeds_native_cart', JSON.stringify(nextCart));
        return nextCart;
      });

      // Keep backend legacy format in sync for /api/checkout compatibility
      try {
        const lineItemsToAdd = [
          {
            merchandiseId: targetVariantId,
            quantity: quantity,
          }
        ];
        await addItemToCart(currentCartId, lineItemsToAdd);
      } catch (backendSyncErr) {
        // Native cart state is already updated; non-blocking sync
      }
    } catch (e) {
      console.error("Error adding to cart:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (lineItemId: string) => {
    setIsLoading(true);
    try {
      setCart((prevCart) => {
        const nextCart = prevCart.filter((item) => item.lineItemId !== lineItemId && item.id !== lineItemId);
        localStorage.setItem('baemeds_native_cart', JSON.stringify(nextCart));
        return nextCart;
      });

      const currentCartId = cartId || localStorage.getItem('shopify_cart_id');
      if (currentCartId) {
        try {
          await removeLineItemFromCart(currentCartId, [lineItemId]);
        } catch {}
      }
    } catch (e) {
      console.error("Error removing item:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (lineItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(lineItemId);
      return;
    }
    
    setIsLoading(true);
    try {
      setCart((prevCart) => {
        const nextCart = prevCart.map((item) => {
          if (item.lineItemId === lineItemId || item.id === lineItemId) {
            return { ...item, quantity };
          }
          return item;
        });
        localStorage.setItem('baemeds_native_cart', JSON.stringify(nextCart));
        return nextCart;
      });

      const currentCartId = cartId || localStorage.getItem('shopify_cart_id');
      if (currentCartId) {
        try {
          await updateLineItemInCart(currentCartId, [{ id: lineItemId, quantity }]);
        } catch {}
      }
    } catch (e) {
      console.error("Error updating quantity:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('baemeds_native_cart');
    const currentCartId = cartId || localStorage.getItem('shopify_cart_id');
    if (currentCartId) {
      localStorage.removeItem(`baemeds_cart_${currentCartId}`);
    }
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Wishlist Functions
  const addToWishlist = (product: Product) => {
    setWishlist(prev => {
        if (prev.some(p => p.id === product.id)) return prev;
        return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      syncCartWithCustomer,
      cartTotal, 
      cartCount,
      isCartOpen,
      toggleCart, 
      checkoutUrl, 
      isLoading, 
      wishlist, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
