import React from 'react';
import { AlertCircle, Clock3, Heart, ImageOff, ShoppingCart, Star } from 'lucide-react';
import { APP_NAME } from '../constants';
import { Link, useCart } from '../context/CartContext';
import { useReviews } from '../context/ReviewsContext';
import { flyToCart } from '../lib/flyToCart';
import { formatPrice } from '../lib/marketConfig';
import { Product } from '../types';
import { getHighResImageUrl, handleImageFallback } from '../utils/imageOptimizer';

interface ProductCardProps {
  product: Product;
}

const getOfferRemaining = (productId: string) => {
  const seed = [...productId].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 7);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const cycleDays = 15 + (seed % 14);
  const cycleLength = 28 * 24 * 60 * 60 * 1000;
  const cycleStart = startOfToday - (startOfToday % cycleLength);
  let expiry = cycleStart + cycleDays * 24 * 60 * 60 * 1000;
  while (expiry - now.getTime() < 15 * 24 * 60 * 60 * 1000) expiry += cycleLength;
  const remainingMinutes = Math.max(1, Math.ceil((expiry - now.getTime()) / 60_000));
  const days = Math.floor(remainingMinutes / (24 * 60));
  const hours = Math.floor((remainingMinutes % (24 * 60)) / 60);
  return `${days}d ${hours}h`;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { getReviewsSummary } = useReviews();
  const [imageFailed, setImageFailed] = React.useState(false);
  const [cartState, setCartState] = React.useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const [offerRemaining, setOfferRemaining] = React.useState(() => getOfferRemaining(product.id));
  const summary = getReviewsSummary(product.id, product.rating || 0, product.reviewCount || 0);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const inWishlist = isInWishlist(product.id);
  const productPath = `/products/${product.handle}`;
  const vendorName = /mohsin/i.test(product.vendor || '') ? APP_NAME : product.vendor;

  React.useEffect(() => {
    const timer = window.setInterval(() => setOfferRemaining(getOfferRemaining(product.id)), 60_000);
    return () => window.clearInterval(timer);
  }, [product.id]);

  const handleAddToCart = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!product.inStock || cartState === 'adding') return;
    flyToCart(event.currentTarget, product.image || undefined);
    setCartState('adding');
    try {
      await addToCart(product);
      setCartState('added');
    } catch (error) {
      console.error('Add to cart failed:', error);
      setCartState('error');
    }
  };

  const handleWishlistToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  return (
    <article className={`motion-lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft ${!product.inStock ? 'bg-slate-50' : ''}`}>
      <button
        type="button"
        onClick={handleWishlistToggle}
        className="tap-target absolute right-2 top-2 z-20 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm hover:text-medical-alert"
        aria-label={inWishlist ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
        aria-pressed={inWishlist}
      >
        <Heart size={19} className={inWishlist ? 'fill-current text-medical-alert' : ''} />
      </button>

      <Link to={productPath} className="relative flex h-52 items-center justify-center overflow-hidden bg-slate-50 p-5" aria-label={`View ${product.title}${discount > 0 ? `, ${discount}% off` : ''}`}>
        {product.image && !imageFailed ? (
          <img
            src={getHighResImageUrl(product.image)}
            alt={product.title}
            loading="lazy"
            onError={(e) => handleImageFallback(e, () => setImageFailed(true))}
            className={`h-full w-full object-contain transition duration-500 hover:scale-105 ${!product.inStock ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-500">
            <ImageOff size={28} /> Image unavailable
          </span>
        )}

        <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!product.inStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-black text-white">
              <AlertCircle size={11} /> Out of stock
            </span>
          ) : (
            <>
              {product.tags?.includes('Flagship Hero') && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                  ★ Best Seller
                </span>
              )}
              {discount > 0 && <span className="rounded-full bg-medical-accent px-2.5 py-1 text-[10px] font-black text-medical-dark">{discount}% off</span>}
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm" title="Offer availability is item-specific">
                <Clock3 size={11} /> Offer ends in {offerRemaining}
              </span>
              {product.requiresPrescription && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-black text-white">
                  Rx Required
                </span>
              )}
              {product.variants && product.variants.length > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-800 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                  {product.variants.length} Sizes Available
                </span>
              )}
            </>
          )}
        </span>
      </Link>


      <div className="flex flex-1 flex-col p-4">
        {vendorName && <p className="text-xs font-bold uppercase tracking-wide text-medical-text">{vendorName}</p>}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-medical-dark md:text-base">
          <Link to={productPath} className="hover:text-medical-primary">{product.title}</Link>
        </h3>

        {summary.count > 0 && summary.rating > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-medical-light px-2 py-1 font-bold text-medical-primary">
              {summary.rating} <Star size={12} fill="currentColor" />
            </span>
            <span className="text-medical-text">{summary.count} verified review{summary.count === 1 ? '' : 's'}</span>
          </div>
        )}

        {product.specs && <p className="mt-3 line-clamp-2 text-xs leading-5 text-medical-text">{product.specs}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
          <div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="text-xs text-medical-text line-through">{formatPrice(product.compareAtPrice)}</p>
            )}
            <p className={`text-lg font-black ${product.inStock ? 'text-amber-900' : 'text-medical-text'}`}>
              {product.variants && product.variants.length > 1 ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
            </p>
          </div>
          {product.variants && product.variants.length > 1 ? (
            <Link
              to={productPath}
              className="tap-target inline-flex items-center justify-center gap-1 rounded-xl bg-medical-primary px-3 text-xs font-bold text-white hover:bg-medical-dark transition"
              aria-label={`Select size and quantity for ${product.title}`}
            >
              Choose Size
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock || cartState === 'adding'}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-medical-primary px-3 text-sm font-bold text-white hover:bg-medical-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              aria-label={product.inStock ? `${cartState === 'adding' ? 'Adding' : 'Add'} ${product.title} to cart` : `${product.title} is out of stock`}
            >
              <ShoppingCart size={18} />
              <span className="hidden xl:inline">{cartState === 'adding' ? 'Adding...' : cartState === 'added' ? 'Added' : 'Add'}</span>
            </button>
          )}
        </div>
        <p className={`mt-2 min-h-4 text-xs font-semibold ${cartState === 'error' ? 'text-medical-alert' : 'text-medical-secondary'}`} aria-live="polite">
          {cartState === 'error' ? 'Could not add this item. Try again.' : cartState === 'added' ? 'Added to cart.' : ''}
        </p>
      </div>
    </article>
  );
};

export default ProductCard;
