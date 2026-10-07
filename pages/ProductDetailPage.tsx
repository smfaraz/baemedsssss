import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  Check,
  ChevronRight,
  FileText,
  Heart,
  ImageOff,
  Loader,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';
import { Link, useCart, useNavigate, useParams } from '../context/CartContext';
import { useReviews } from '../context/ReviewsContext';
import { ProductReviewsSection } from '../components/reviews/ProductReviewsSection';
import { flyToCart } from '../lib/flyToCart';
import { rememberRecentlyViewedProduct } from '../lib/recentlyViewed';
import { fetchProductByHandle, fetchRecommendedProducts } from '../lib/commerce';
import { formatPrice, isValidUSZip } from '../lib/marketConfig';
import { Analytics } from '../lib/analytics';
import { Product, ProductVariant } from '../types';
import { getHighResImageUrl, handleImageFallback } from '../utils/imageOptimizer';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, isLoading: isCartLoading } = useCart();
  const { getReviewsSummary } = useReviews();

  const [product, setProduct] = useState<Product>();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [cartError, setCartError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [emailAppOpened, setEmailAppOpened] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [zipCodeStatus, setZipCodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const touchStartX = React.useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        const loadedProduct = await fetchProductByHandle(id);
        if (cancelled) return;
        setProduct(loadedProduct);
        if (loadedProduct) {
          rememberRecentlyViewedProduct(loadedProduct);
          Analytics.trackViewItem(loadedProduct);
        }
        setActiveImage(loadedProduct?.image || '');
        setImageFailed(false);
        setQuantity(1);
        setCartError('');
        setZipCode('');
        setZipCodeStatus('idle');

        if (loadedProduct) {
          try {
            const recommended = await fetchRecommendedProducts(loadedProduct, 4);
            if (!cancelled) {
              setRelatedProducts(recommended);
            }
          } catch (relatedError) {
            console.error('Could not load recommended products', relatedError);
            if (!cancelled) setRelatedProducts([]);
          }
        }
      } catch (error) {
        console.error('Failed to load product detail', error);
        if (!cancelled) setLoadError('We could not load this product right now. Please try again or contact support.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product) {
      setSelectedVariant(null);
      setSelectedSize('');
      setSelectedPack('');
      return;
    }

    if (product.variants && product.variants.length > 0) {
      // ALWAYS prioritize Single Unit / EA 1 as the main default option
      const eaVariant = product.variants.find((v) =>
        /ea|single|unit|each/i.test(v.title || '') ||
        /ea|single|unit|each/i.test(v.size || '') ||
        (v.packageQuantity && /1\s*(unit|ea|each)/i.test(v.packageQuantity))
      );
      let initial = product.variants.find((v) => v.id === product.selectedVariantId);
      if (!initial || (!product.selectedVariantId && eaVariant)) {
        initial = eaVariant || product.variants.find((v) => v.inStock !== false) || product.variants[0];
      }
      setSelectedVariant(initial);
      setSelectedSize(initial.size || '');
      setSelectedPack(initial.packageQuantity || '');
      if (initial.image) setActiveImage(initial.image);
    } else {
      setSelectedVariant(null);
      setSelectedSize('');
      setSelectedPack('');
    }
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];
    // Guarantee Single Unit / EA 1 option is ALWAYS shown first
    return sizes.sort((a, b) => {
      const isA_EA = /ea|single|unit|each/i.test(a);
      const isB_EA = /ea|single|unit|each/i.test(b);
      if (isA_EA && !isB_EA) return -1;
      if (!isA_EA && isB_EA) return 1;
      return 0;
    });
  }, [product?.variants]);

  const availablePacks = useMemo(() => {
    if (!product?.variants || !selectedSize) return [];
    const forSize = product.variants.filter((v) => v.size === selectedSize);
    return [...new Set(forSize.map((v) => v.packageQuantity).filter(Boolean))] as string[];
  }, [product?.variants, selectedSize]);

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    if (!product?.variants) return;
    const matchingVariants = product.variants.filter((v) => v.size === size);
    const samePack = matchingVariants.find((v) => v.packageQuantity === selectedPack);
    const target = samePack || matchingVariants[0];
    if (target) {
      setSelectedVariant(target);
      setSelectedPack(target.packageQuantity || '');
      if (target.image) setActiveImage(target.image);
    }
  };

  const handleSelectPack = (pack: string) => {
    setSelectedPack(pack);
    if (!product?.variants) return;
    const target = product.variants.find((v) => v.size === selectedSize && v.packageQuantity === pack)
      || product.variants.find((v) => v.packageQuantity === pack);
    if (target) {
      setSelectedVariant(target);
      if (target.image) setActiveImage(target.image);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
  const currentCompareAtPrice = selectedVariant ? (selectedVariant.compareAtPrice ?? product?.compareAtPrice) : product?.compareAtPrice;
  const isCurrentlyInStock = selectedVariant ? (selectedVariant.inStock !== false) : (product?.inStock ?? false);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    return [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
  }, [product]);

  const changeGalleryImage = (direction: 1 | -1) => {
    if (galleryImages.length < 2) return;
    const currentIndex = Math.max(0, galleryImages.indexOf(activeImage));
    const nextIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[nextIndex]);
    setImageFailed(false);
  };

  const safeDescription = useMemo(
    () => DOMPurify.sanitize(product?.description || '', { USE_PROFILES: { html: true } }),
    [product?.description],
  );

  const reviewsSummary = useMemo(() => {
    if (!product) return { rating: 5, count: 0, breakdown: {}, recommendedPercentage: 100, photoCount: 0 };
    return getReviewsSummary(product.id, product.rating, product.reviewCount);
  }, [product, getReviewsSummary]);

  const discount = currentCompareAtPrice && currentCompareAtPrice > currentPrice
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0;
  const inWishlist = product ? isInWishlist(product.id) : false;
  const phoneHref = `tel:${CONTACT_PHONE.replace(/\D/g, '')}`;

  const handleAddToCart = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!product || !isCurrentlyInStock || isCartLoading) return;
    setCartError('');
    try {
      if (event) {
        flyToCart(event.currentTarget, activeImage || product.image);
      }
      const productToAdd: Product = selectedVariant
        ? {
            ...product,
            variantId: selectedVariant.id,
            price: selectedVariant.price,
            compareAtPrice: selectedVariant.compareAtPrice ?? product.compareAtPrice,
            sku: selectedVariant.sku || product.sku,
            title: `${product.title} - ${selectedVariant.title}`,
            specs: selectedVariant.size
              ? `Size: ${selectedVariant.size}${selectedVariant.packageQuantity ? ` · ${selectedVariant.packageQuantity}` : ''}`
              : product.specs,
            image: selectedVariant.image || product.image,
          }
        : product;

      await addToCart(productToAdd, quantity);
      Analytics.trackAddToCart(productToAdd, quantity);
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 2200);
    } catch (error) {
      console.error('Add to cart failed', error);
      setCartError('Could not add product to cart. Please try again.');
    }
  };

  const handleBuyNow = async () => {
    if (!product || !isCurrentlyInStock || isBuyingNow || isCartLoading) return;
    setCartError('');
    setIsBuyingNow(true);
    try {
      const productToAdd: Product = selectedVariant
        ? {
            ...product,
            variantId: selectedVariant.id,
            price: selectedVariant.price,
            compareAtPrice: selectedVariant.compareAtPrice ?? product.compareAtPrice,
            sku: selectedVariant.sku || product.sku,
            title: `${product.title} - ${selectedVariant.title}`,
            specs: selectedVariant.size
              ? `Size: ${selectedVariant.size}${selectedVariant.packageQuantity ? ` · ${selectedVariant.packageQuantity}` : ''}`
              : product.specs,
            image: selectedVariant.image || product.image,
          }
        : product;

      await addToCart(productToAdd, quantity);
      Analytics.trackAddToCart(productToAdd, quantity);
      navigate('/checkout');
    } catch (error) {
      console.error('Buy now failed', error);
      setCartError('Could not process immediate checkout. Please try again.');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = () => {
    if (!product) return;
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: `${product.title} | ${APP_NAME}`,
      text: `Check out ${product.title} on ${APP_NAME}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  };

  const handleNotify = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    const subject = encodeURIComponent(`Stock Notification Request: ${product.title}`);
    const body = encodeURIComponent(`Hello BaeMeds Clinical Support,\n\nPlease notify me at ${notifyEmail} when ${product.title} (${product.id}) is back in stock.\n\nThank you.`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setEmailAppOpened(true);
  };

  const handleZipCodeCheck = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isValidUSZip(zipCode)) {
      setZipCodeStatus('valid');
    } else {
      setZipCodeStatus('invalid');
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-medical-text">
          <Loader size={36} className="animate-spin text-medical-primary" />
          <p className="text-sm font-semibold">Loading product specifications...</p>
        </div>
      </main>
    );
  }

  if (loadError || !product) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-medical-dark">Product Not Found</h1>
        <p className="mt-2 text-sm text-medical-text">{loadError || 'The requested medical equipment could not be found.'}</p>
        <Link to="/products" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-medical-primary px-6 font-bold text-white hover:bg-medical-dark transition">
          Browse All Products
        </Link>
      </main>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: product.image,
    description: product.description?.replace(/<[^>]*>/g, '').slice(0, 200),
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'BaeMeds',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: window.location.href,
    },
    aggregateRating: reviewsSummary.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: reviewsSummary.rating,
      reviewCount: reviewsSummary.count,
    } : undefined,
  };

  return (
    <main className="pb-24">
      <SEO
        title={`${product.title} — Buy & Rent Online`}
        description={`Order certified ${product.title} from BaeMeds. FSA/HSA eligible, US nationwide delivery with biomedical inspection and manufacturer warranty.`}
        image={product.image}
        type="product"
        canonical={`/products/${product.handle || product.id}`}
        structuredData={structuredData}
      />

      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex min-h-12 items-center gap-1 overflow-hidden px-4 text-xs text-medical-text sm:text-sm">
          <Link to="/" className="shrink-0 rounded-lg px-1 py-2 hover:text-medical-primary">Home</Link>
          <ChevronRight size={14} className="shrink-0" />
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="shrink-0 rounded-lg px-1 py-2 hover:text-medical-primary">{product.category}</Link>
          <ChevronRight size={14} className="shrink-0" />
          <span className="truncate font-semibold text-medical-dark" aria-current="page">{product.title}</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-9">
        <div className="grid gap-7 lg:grid-cols-2 lg:gap-12">
          {/* Product Gallery */}
          <section aria-label="Product gallery">
            <div
              className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10"
              onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return;
                const delta = event.changedTouches[0]?.clientX - touchStartX.current;
                if (Math.abs(delta) > 45) changeGalleryImage(delta < 0 ? 1 : -1);
                touchStartX.current = null;
              }}
            >
              {!imageFailed && activeImage ? (
                <img
                  src={getHighResImageUrl(activeImage)}
                  alt={product.title}
                  onError={(e) => handleImageFallback(e, () => setImageFailed(true))}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center text-medical-text">
                  <ImageOff size={48} className="mx-auto" />
                  <p className="mt-3 text-sm font-semibold">Product image unavailable</p>
                </div>
              )}
              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                  {discount}% off
                </span>
              )}
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-label={inWishlist ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
                  aria-pressed={inWishlist}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-medical-text shadow-soft hover:border-medical-primary hover:text-medical-primary transition"
                >
                  <Heart size={19} className={inWishlist ? 'fill-rose-600 text-medical-accent' : ''} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share this product"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-medical-text shadow-soft hover:border-medical-primary hover:text-medical-primary transition"
                >
                  <Share2 size={19} />
                </button>
              </div>
              {isCopied && (
                <span role="status" className="absolute bottom-4 right-4 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">
                  Link copied
                </span>
              )}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow-sm" aria-label="Image slider position">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => { setActiveImage(image); setImageFailed(false); }}
                      aria-label={`Show image ${index + 1}`}
                      aria-current={activeImage === image}
                      className={`h-2 w-2 rounded-full ${activeImage === image ? 'bg-medical-primary' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft" aria-label="Choose product image">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-medical-text">
                  Product images <span className="font-medium normal-case tracking-normal text-slate-500">· tap to view</span>
                </p>
                <div className="flex snap-x gap-3 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => { setActiveImage(image); setImageFailed(false); }}
                      aria-label={`View product image ${index + 1}`}
                      aria-pressed={activeImage === image}
                      className={`relative h-24 w-24 shrink-0 snap-start rounded-xl border-2 bg-white p-2 transition hover:-translate-y-0.5 hover:border-medical-primary ${activeImage === image ? 'border-medical-primary ring-2 ring-medical-accent' : 'border-slate-200'}`}
                    >
                      <img
                        src={getHighResImageUrl(image)}
                        alt={`${product.title} view ${index + 1}`}
                        onError={(e) => handleImageFallback(e)}
                        className="h-full w-full object-contain"
                      />
                      <span className={`absolute bottom-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-black ${activeImage === image ? 'bg-medical-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Product Details & Actions */}
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-medical-primary">{product.vendor} • {product.category}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-medical-dark sm:text-4xl">{product.title}</h1>
            
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('product-reviews');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition cursor-pointer"
              >
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="font-extrabold">{reviewsSummary.rating.toFixed(1)}</span>
                <span className="text-amber-700">({reviewsSummary.count} verified reviews)</span>
              </button>

              <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.inStock ? 'bg-medical-secondary-soft text-medical-secondary' : 'bg-rose-50 text-rose-800'}`}>
                {product.inStock ? 'In stock' : 'Out of stock'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-medical-text">
                FSA / HSA Eligible
              </span>
            </div>

            {/* Multi-Variant Size & Quantity Selector */}
            {product.variants && product.variants.length > 1 && (
              <div className="mt-5 rounded-2xl border border-medical-primary/20 bg-white p-4 shadow-sm space-y-4">
                {availableSizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-medical-text">
                        Select {availableSizes.some((s) => /unit|pack|case|box|ea|cs/i.test(s)) ? 'Packaging / Option' : 'Size'}: <strong className="text-medical-dark font-extrabold">{selectedSize}</strong>
                      </span>
                      {selectedVariant?.size && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isCurrentlyInStock
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}>
                          {isCurrentlyInStock ? 'In Stock' : 'Limited Supply'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((sz) => {
                        const isSelected = sz === selectedSize;
                        const matching = product.variants?.filter((v) => v.size === sz);
                        const hasStock = matching?.some((v) => v.inStock !== false);
                        const lowestSizePrice = matching?.length ? Math.min(...matching.map((v) => v.price)) : 0;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleSelectSize(sz)}
                            className={`min-h-12 px-4 py-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'border-medical-primary bg-medical-primary text-white shadow-sm ring-2 ring-medical-primary/20 scale-[1.02]'
                                : hasStock
                                ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-medical-primary hover:bg-white'
                                : 'border-slate-100 bg-slate-100/60 text-slate-400 line-through'
                            }`}
                          >
                            <span className="text-xs">{sz}</span>
                            <span className={`text-[10px] font-medium ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                              {lowestSizePrice > 0 ? formatPrice(lowestSizePrice) : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availablePacks.length > 1 && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-medical-text mb-2">
                      Select Package / Quantity: <strong className="text-medical-dark font-extrabold">{selectedPack}</strong>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availablePacks.map((pack) => {
                        const isSelected = pack === selectedPack;
                        const vForPack = product.variants?.find((v) => v.size === selectedSize && v.packageQuantity === pack);
                        return (
                          <button
                            key={pack}
                            type="button"
                            onClick={() => handleSelectPack(pack)}
                            className={`min-h-10 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              isSelected
                                ? 'border-medical-dark bg-medical-dark text-white shadow-sm ring-2 ring-medical-dark/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {pack} {vForPack ? `· ${formatPrice(vForPack.price)}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 rounded-3xl border border-medical-primary/20 bg-gradient-to-br from-white via-white to-medical-light/50 p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-medical-dark">{formatPrice(currentPrice)}</span>
                {selectedVariant?.packageQuantity && (
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {selectedVariant.packageQuantity}
                  </span>
                )}
                {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base text-slate-400 line-through font-medium">
                      MSRP {formatPrice(currentCompareAtPrice)}
                    </span>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-black text-emerald-800 shadow-xs">
                      Save ${(currentCompareAtPrice - currentPrice).toFixed(2)} ({discount}% OFF)
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
                ★ Direct distributor pricing • Official manufacturer warranty included
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-[132px_1fr_1fr]">
                <div className="flex min-h-12 items-center justify-between rounded-xl border border-slate-300 bg-white">
                  <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-50" aria-label="Decrease quantity"><Minus size={17} /></button>
                  <span className="font-bold text-medical-dark" aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((current) => current + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-50" aria-label="Increase quantity"><Plus size={17} /></button>
                </div>
                <button type="button" onClick={handleAddToCart} disabled={!isCurrentlyInStock || isCartLoading || isAdded} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 font-black text-white shadow-md hover:bg-medical-dark disabled:cursor-not-allowed disabled:bg-slate-300 transition">
                  {isCartLoading ? <Loader size={18} className="animate-spin" /> : isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {isCurrentlyInStock ? (isAdded ? 'Added to cart' : 'Add to cart') : 'Out of stock'}
                </button>
                <button type="button" onClick={handleBuyNow} disabled={!isCurrentlyInStock || isBuyingNow || isCartLoading} className="flex min-h-12 items-center justify-center rounded-xl border-2 border-medical-accent bg-medical-accent px-4 font-black text-medical-dark shadow-md hover:bg-amber-300 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-medical-text transition">
                  {isBuyingNow ? 'Proceeding to checkout...' : 'Buy now'}
                </button>
              </div>

              {cartError && <p role="alert" className="mt-3 rounded-xl bg-medical-alert bg-opacity-10 px-3 py-2 text-sm font-semibold text-medical-alert">{cartError}</p>}

              {!product.inStock && (
                <div className="mt-5 rounded-2xl border border-medical-accent bg-medical-accent bg-opacity-5 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-medical-accent"><RotateCcw size={17} />Ask about availability</h2>
                  <p className="mt-1 text-xs leading-5 text-medical-text">We will open a prefilled availability email for you to send.</p>
                  <form onSubmit={handleNotify} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="flex-1"><span className="sr-only">Your email address</span><input type="email" required value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} placeholder="Your email address" className="min-h-11 w-full rounded-xl border border-medical-accent bg-white px-3 text-sm outline-none focus:border-medical-primary" /></label>
                    <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-accent px-5 text-sm font-bold text-white"><Mail size={17} />Open email request</button>
                  </form>
                  {emailAppOpened && <p role="status" className="mt-2 text-xs font-semibold text-medical-text">Draft opened. Send it to complete your request.</p>}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a href={phoneHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-medical-primary bg-white px-4 font-bold text-medical-primary hover:bg-medical-light transition">
                <Phone size={18} />Call about this product
              </a>
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Product Enquiry: ${product.title}`)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 font-bold text-white hover:bg-medical-dark transition">
                <Mail size={18} />Email clinical support
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-medical-dark"><MapPin size={17} />Delivery estimator</h2>
              <form onSubmit={handleZipCodeCheck} className="mt-3 flex gap-2">
                <label className="flex-1"><span className="sr-only">Five-digit US delivery ZIP code</span><input type="text" inputMode="numeric" autoComplete="postal-code" value={zipCode} onChange={(event) => { setZipCode(event.target.value.replace(/\D/g, '').slice(0, 5)); setZipCodeStatus('idle'); }} placeholder="Enter 5-digit ZIP code (e.g. 19801)" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-medical-primary" /></label>
                <button type="submit" className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-medical-dark hover:bg-slate-50 transition">Check</button>
              </form>
              {zipCodeStatus === 'valid' && <p role="status" className="mt-2 text-xs leading-5 text-medical-text">ZIP code {zipCode} verified. Carrier shipping rates and delivery estimates will be calculated at checkout.</p>}
              {zipCodeStatus === 'invalid' && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">Please enter a valid 5-digit US ZIP code.</p>}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {product.warranty && (
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <ShieldCheck className="shrink-0 text-medical-primary" size={22} />
                  <div>
                    <p className="text-sm font-bold text-medical-dark">Warranty listed</p>
                    <p className="mt-1 text-xs leading-5 text-medical-text">{product.warranty}. Full manufacturer warranty and support included.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <FileText className="shrink-0 text-medical-primary" size={22} />
                <div>
                  <p className="text-sm font-bold text-medical-dark">FSA / HSA & Itemized Invoicing</p>
                  <p className="mt-1 text-xs leading-5 text-medical-text">Itemized receipts suitable for insurance and FSA/HSA reimbursement provided.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Decentralized In-Page Quick Jump Bar */}
        <nav aria-label="Product Sections" className="mt-10 sticky top-20 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-slate-50/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            <a href="#product-description" className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white text-medical-dark border border-slate-200 hover:border-medical-primary hover:text-medical-primary shadow-xs transition">
              Overview &amp; Features
            </a>
            <a href="#product-specifications" className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white text-medical-dark border border-slate-200 hover:border-medical-primary hover:text-medical-primary shadow-xs transition">
              Technical Specifications
            </a>
            <a href="#product-reviews" className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white text-medical-dark border border-slate-200 hover:border-medical-primary hover:text-medical-primary shadow-xs transition inline-flex items-center gap-1.5">
              <span>Customer Reviews</span>
              {reviewsSummary.count > 0 && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {reviewsSummary.count}
                </span>
              )}
            </a>
            {relatedProducts.length > 0 && (
              <a href="#product-recommended" className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white text-medical-dark border border-slate-200 hover:border-medical-primary hover:text-medical-primary shadow-xs transition">
                Recommended Items
              </a>
            )}
          </div>
        </nav>

        {/* 1. Decentralized Section: Product Description */}
        <section id="product-description" className="mt-6 scroll-mt-36 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-soft">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-medical-dark">Clinical Overview &amp; Product Details</h2>
            <p className="text-xs text-medical-text">Key therapeutic capabilities, intended usage, and patient guidelines</p>
          </div>
          {safeDescription ? (
            <div className="prose prose-sm max-w-none text-medical-text" dangerouslySetInnerHTML={{ __html: safeDescription }} />
          ) : (
            <div>
              <p className="mt-2 text-sm leading-6 text-medical-text">
                Product details are being updated. Contact our clinical engineering team to confirm specific patient requirements and compatibility.
              </p>
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Product details request: ${product.title}`)}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-primary px-4 font-bold text-medical-primary hover:bg-medical-light transition">
                Request Specifications Sheet
              </a>
            </div>
          )}
        </section>

        {/* 2. Decentralized Section: Technical Specifications Table */}
        <section id="product-specifications" className="mt-8 scroll-mt-36 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-soft">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-medical-dark">Technical &amp; Manufacturer Specifications</h2>
            <p className="text-xs text-medical-text">Engineering parameters, compliance certifications, and manufacturer warranty data</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Specifications for {product.title}</caption>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60"><th scope="row" className="w-1/3 py-3 pr-4 font-bold text-medical-dark">Brand / Manufacturer</th><td className="py-3 text-medical-text font-medium">{product.vendor}</td></tr>
                <tr className="hover:bg-slate-50/60"><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Product Name</th><td className="py-3 text-medical-text font-medium">{product.title}</td></tr>
                <tr className="hover:bg-slate-50/60"><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Clinical Category</th><td className="py-3 text-medical-text">{product.category}</td></tr>
                <tr className="hover:bg-slate-50/60"><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Item SKU / Catalog ID</th><td className="py-3 font-mono text-xs text-medical-dark">{product.id}</td></tr>
                {product.specs && (
                  <tr className="hover:bg-slate-50/60"><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Technical Parameters &amp; Dimensions</th><td className="py-3 text-medical-text">{product.specs}</td></tr>
                )}
                <tr className="hover:bg-slate-50/60">
                  <th scope="row" className="py-3 pr-4 font-bold text-medical-dark">HCPCS Billing Code</th>
                  <td className="py-3 text-medical-text font-semibold text-medical-primary">
                    {product.hcpcsCode || (
                      product.category.toLowerCase().includes('oxygen') ? 'E1390 / E1392 (Oxygen Equipment)' :
                      product.category.toLowerCase().includes('wheelchair') ? 'K0001 / K0004 (Standard / High-Strength Mobility)' :
                      product.category.toLowerCase().includes('cpap') || product.category.toLowerCase().includes('bipap') ? 'E0601 / E0470 (Positive Airway Pressure)' :
                      product.category.toLowerCase().includes('nebulizer') ? 'E0570 (Compressor Nebulizer)' :
                      product.category.toLowerCase().includes('suction') ? 'E0600 (Respiratory Suction Pump)' :
                      'A-Series / DME Supply Code'
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <th scope="row" className="py-3 pr-4 font-bold text-medical-dark">FDA Regulatory Status</th>
                  <td className="py-3 text-medical-text">
                    {product.fdaClassification || (
                      product.category.toLowerCase().includes('oxygen') || product.category.toLowerCase().includes('cpap')
                        ? 'FDA Class II Medical Device (510(k) Cleared)'
                        : 'FDA Class I Medical Device (Hospital & Home Grade)'
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Reimbursement Eligibility</th>
                  <td className="py-3 text-medical-text font-semibold text-medical-secondary">FSA / HSA Eligible • Itemized Medical Invoicing Included</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Quality &amp; Inspection</th>
                  <td className="py-3 text-medical-text">100% Brand New in Original Factory Packaging • Certified Pre-Shipment Biomedical Verification</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Manufacturer Warranty</th>
                  <td className="py-3 text-medical-text font-semibold text-medical-secondary">{product.warranty || '1 Year Standard Manufacturer Warranty'}</td>
                </tr>
                {product.metafields?.map((field) => (
                  <tr key={`${field.namespace}-${field.key}`} className="hover:bg-slate-50/60">
                    <th scope="row" className="py-3 pr-4 font-bold capitalize text-medical-dark">{field.key.replace(/_/g, ' ')}</th>
                    <td className="py-3 text-medical-text">{field.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!product.metafields?.length && !product.warranty && (
              <p className="mt-4 text-xs leading-5 text-medical-text">
                Standard biomedical hospital compliance applies. Contact BaeMeds clinical support for complete technical datasheets.
              </p>
            )}
          </div>
        </section>

        {/* 3. Decentralized Section: Customer Reviews & Photo Gallery */}
        <section id="product-reviews" className="mt-8 scroll-mt-36 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-soft">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Star size={20} className="fill-amber-400 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-medical-dark">Verified Customer &amp; Clinical Reviews</h2>
                <p className="text-xs text-medical-text">Doctor, clinic, and patient experiences with equipment photos</p>
              </div>
            </div>
            {reviewsSummary.count > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-200">
                <span>{reviewsSummary.rating.toFixed(1)} ★</span>
                <span className="text-amber-700">({reviewsSummary.count} verified)</span>
              </div>
            )}
          </div>

          <ProductReviewsSection product={product} />
        </section>

        {/* 4. Decentralized Section: Clinically Recommended Equipment */}
        {relatedProducts.length > 0 && (
          <section id="product-recommended" className="mt-14 scroll-mt-36" aria-labelledby="recommended-products-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200/80 mb-2 shadow-xs">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Clinically Recommended</span>
                </div>
                <h2 id="recommended-products-heading" className="text-2xl font-bold text-medical-dark sm:text-3xl">
                  Recommended Medical Equipment
                </h2>
                <p className="mt-1 text-sm text-medical-text">
                  Complementary devices, diagnostics, and accessories frequently paired with this item
                </p>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-medical-primary shadow-sm hover:border-medical-primary hover:bg-medical-light transition"
              >
                <span>View all in {product.category}</span>
                <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>

      {cartError && (
        <div role="alert" className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-2xl bg-medical-alert px-4 py-3 text-sm font-semibold text-white shadow-xl md:hidden">
          <span className="flex-1">{cartError}</span>
          <button type="button" onClick={() => setCartError('')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-white/10" aria-label="Dismiss cart error"><X size={18} /></button>
        </div>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button type="button" onClick={handleAddToCart} disabled={!product.inStock || isCartLoading || isAdded} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-medical-primary px-3 text-sm font-bold text-white disabled:bg-slate-300">{isCartLoading ? <Loader size={17} className="animate-spin" /> : isAdded ? <Check size={17} /> : <ShoppingCart size={17} />}{product.inStock ? (isAdded ? 'Added' : 'Add to cart') : 'Out of stock'}</button>
          {product.inStock && <button type="button" onClick={handleBuyNow} disabled={isBuyingNow || isCartLoading} className="min-h-12 flex-1 rounded-xl border border-medical-primary px-3 text-sm font-bold text-medical-primary disabled:border-slate-300 disabled:text-medical-text">{isBuyingNow ? 'Opening cart...' : 'Buy now'}</button>}
          {!product.inStock && <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Availability inquiry: ${product.title}`)}`} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-medical-primary px-3 text-sm font-bold text-medical-primary">Ask availability</a>}
        </div>
      </div>
    </main>
  );
};

export default ProductDetailPage;
