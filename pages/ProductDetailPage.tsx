import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  Calendar,
  Check,
  ChevronRight,
  FileText,
  Heart,
  ImageOff,
  Loader,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  X,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import RentalModal from '../components/RentalModal';
import SEO from '../components/SEO';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';
import { Link, useCart, useNavigate, useParams } from '../context/CartContext';
import { flyToCart } from '../lib/flyToCart';
import { rememberRecentlyViewedProduct } from '../lib/recentlyViewed';
import { fetchProductByHandle, fetchProductsByCategory, isRentalAvailable } from '../lib/shopify';
import { Product } from '../types';
import { submitEnquiry } from '../lib/enquiries';
import WhatsAppIcon from '../components/WhatsAppIcon';

type DetailTab = 'description' | 'specifications';

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price);

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, isLoading: isCartLoading } = useCart();
  const [product, setProduct] = useState<Product>();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [isAdded, setIsAdded] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [cartError, setCartError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [emailAppOpened, setEmailAppOpened] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
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
        if (loadedProduct) rememberRecentlyViewedProduct(loadedProduct);
        setActiveImage(loadedProduct?.image || '');
        setImageFailed(false);
        setQuantity(1);
        setCartError('');
        setPincode('');
        setPincodeStatus('idle');

        if (loadedProduct) {
          try {
            const related = await fetchProductsByCategory(loadedProduct.category);
            if (!cancelled) setRelatedProducts(related.filter((item) => item.id !== loadedProduct.id).slice(0, 4));
          } catch (error) {
            console.error('Related products could not be loaded', error);
            if (!cancelled) setRelatedProducts([]);
          }
        }
      } catch (error) {
        console.error('Product could not be loaded', error);
        if (!cancelled) {
          setProduct(undefined);
          setLoadError('This product could not be loaded right now.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProduct();
    return () => { cancelled = true; };
  }, [id]);

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

  const discount = product?.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const inWishlist = product ? isInWishlist(product.id) : false;
  const phoneHref = `tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`;
  const whatsappHref = product
    ? `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello Baemeds, I would like to ask about ${product.title}: ${window.location.href}`)}`
    : '#';

  const handleAddToCart = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!product?.inStock) return;
    if (event) flyToCart(event.currentTarget, product.image || activeImage || undefined);
    setCartError('');
    try {
      await addToCart(product, quantity);
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 1800);
    } catch (error) {
      console.error('Could not add product to cart', error);
      setCartError('Couldnâ€™t add this product to your cart. Please try again or contact us.');
    }
  };

  const handleBuyNow = async () => {
    if (!product?.inStock) return;
    setIsBuyingNow(true);
    setCartError('');
    try {
      await addToCart(product, quantity);
      navigate('/cart');
    } catch (error) {
      console.error('Could not open cart', error);
      setCartError('Couldnâ€™t add this product to your cart. Please try again or contact us.');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = () => {
    if (!product) return;
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = { title: product.title, text: `${product.title} on ${APP_NAME}`, url: window.location.href };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), 1800);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Product could not be shared', error);
    }
  };

  const handleNotify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product || !notifyEmail.trim()) return;
    await submitEnquiry({ type: 'availability', product: product.title, name: 'Availability request', email: notifyEmail.trim(), phone: 'Not provided', message: `Please confirm availability for ${product.title}. Product link: ${window.location.href}` });
    const subject = encodeURIComponent(`Availability request: ${product.title}`);
    const body = encodeURIComponent(`Please confirm availability for ${product.title}. My email is ${notifyEmail.trim()}. Product link: ${window.location.href}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setEmailAppOpened(true);
  };

  const handlePincodeCheck = (event: React.FormEvent) => {
    event.preventDefault();
    setPincodeStatus(/^\d{6}$/.test(pincode) ? 'valid' : 'invalid');
  };

  if (isLoading) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-16" aria-busy="true">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-4 w-56 rounded bg-slate-200" />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="aspect-square rounded-3xl bg-white" />
            <div className="space-y-5 pt-5"><div className="h-5 w-28 rounded bg-slate-200" /><div className="h-10 w-full rounded bg-slate-200" /><div className="h-24 rounded-2xl bg-white" /><div className="h-14 rounded-xl bg-slate-200" /></div>
          </div>
        </div>
        <span className="sr-only">Loading product</span>
      </main>
    );
  }

  if (!product) {
    const whatsappFallback = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Baemeds, I need help finding a product.')}`;
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft sm:p-12">
          <Stethoscope size={48} className="mx-auto text-medical-primary" />
          <h1 className="mt-5 text-2xl font-bold text-medical-dark">{loadError ? 'Product temporarily unavailable' : 'Product not found'}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-medical-text">{loadError || 'The link may be outdated, or this item is no longer listed. Browse the current catalogue or ask the team to locate it.'}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-medical-primary px-5 font-bold text-white">Browse catalogue</Link>
            <a href={whatsappFallback} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-medical-dark"><MessageCircle size={17} />WhatsApp us</a>
            <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-medical-dark">Contact us</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28 md:pb-16">
      <SEO
        title={product.seo?.title || product.title}
        description={product.seo?.description || product.description?.replace(/(<([^>]+)>)/gi, '').slice(0, 160)}
        ogImage={product.image}
        ogType="product"
        productData={{
          name: product.title,
          image: product.image,
          description: product.description?.replace(/(<([^>]+)>)/gi, '').slice(0, 300) || '',
          sku: product.id.split('/').pop(),
          brand: product.vendor,
          price: product.price,
          currency: 'INR',
          availability: product.inStock ? 'InStock' : 'OutOfStock',
        }}
      />

      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex min-h-12 items-center gap-1 overflow-hidden px-4 text-xs text-medical-text sm:text-sm">
          <Link to="/" className="shrink-0 rounded-lg px-1 py-2 hover:text-medical-primary">Home</Link><ChevronRight size={14} className="shrink-0" />
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="shrink-0 rounded-lg px-1 py-2 hover:text-medical-primary">{product.category}</Link><ChevronRight size={14} className="shrink-0" />
          <span className="truncate font-semibold text-medical-dark" aria-current="page">{product.title}</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-9">
        <div className="grid gap-7 lg:grid-cols-2 lg:gap-12">
          <section aria-label="Product gallery">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10" onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStartX.current === null) return; const delta = event.changedTouches[0]?.clientX - touchStartX.current; if (Math.abs(delta) > 45) changeGalleryImage(delta < 0 ? 1 : -1); touchStartX.current = null; }}>
              {!imageFailed && activeImage ? (
                <img src={activeImage} alt={product.title} onError={() => setImageFailed(true)} className="h-full w-full object-contain" />
              ) : (
                <div className="text-center text-medical-text"><ImageOff size={48} className="mx-auto" /><p className="mt-3 text-sm font-semibold">Product image unavailable</p></div>
              )}
              {discount > 0 && <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">{discount}% off</span>}
              <div className="absolute right-4 top-4 flex gap-2">
                <button type="button" onClick={handleWishlist} aria-label={inWishlist ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`} aria-pressed={inWishlist} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-medical-text shadow-soft hover:border-medical-primary hover:text-medical-primary"><Heart size={19} className={inWishlist ? 'fill-rose-600 text-medical-accent' : ''} /></button>
                <button type="button" onClick={handleShare} aria-label="Share this product" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-medical-text shadow-soft hover:border-medical-primary hover:text-medical-primary"><Share2 size={19} /></button>
              </div>
              {isCopied && <span role="status" className="absolute bottom-4 right-4 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">Link copied</span>}
              {galleryImages.length > 1 && <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow-sm" aria-label="Image slider position">{galleryImages.map((image, index) => <button key={image} type="button" onClick={() => { setActiveImage(image); setImageFailed(false); }} aria-label={`Show image ${index + 1}`} aria-current={activeImage === image} className={`h-2 w-2 rounded-full ${activeImage === image ? 'bg-medical-primary' : 'bg-slate-300'}`} />)}</div>}
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft" aria-label="Choose product image">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-medical-text">Product images <span className="font-medium normal-case tracking-normal text-slate-500">Â· tap to view</span></p>
                <div className="flex snap-x gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button key={image} type="button" onClick={() => { setActiveImage(image); setImageFailed(false); }} aria-label={`View product image ${index + 1}`} aria-pressed={activeImage === image} className={`relative h-24 w-24 shrink-0 snap-start rounded-xl border-2 bg-white p-2 transition hover:-translate-y-0.5 hover:border-medical-primary ${activeImage === image ? 'border-medical-primary ring-2 ring-medical-accent' : 'border-slate-200'}`}><img src={image} alt={`${product.title} view ${index + 1}`} className="h-full w-full object-contain" /><span className={`absolute bottom-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-black ${activeImage === image ? 'bg-medical-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span></button>
                ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-medical-primary">{product.vendor} Â· {product.category}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-medical-dark sm:text-4xl">{product.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full px-3 py-1.5 font-bold ${product.inStock ? 'bg-medical-secondary-soft text-medical-secondary' : 'bg-rose-50 text-rose-800'}`}>{product.inStock ? 'In stock' : 'Out of stock'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-medical-text">GST invoice available</span>
            </div>

            <div className="mt-6 rounded-3xl border border-medical-primary/20 bg-gradient-to-br from-white via-white to-medical-light/50 p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold text-medical-dark">{formatPrice(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && <span className="pb-1 text-lg text-medical-text line-through">{formatPrice(product.compareAtPrice)}</span>}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="mb-1 rounded-full bg-medical-accent px-2.5 py-1 text-xs font-black text-medical-dark">
                    {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% off
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-5 text-medical-text">Taxes, shipping charges and final delivery details are confirmed at checkout.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-[132px_1fr_1fr]">
                <div className="flex min-h-12 items-center justify-between rounded-xl border border-slate-300 bg-white">
                  <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-50" aria-label="Decrease quantity"><Minus size={17} /></button>
                  <span className="font-bold text-medical-dark" aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((current) => current + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-50" aria-label="Increase quantity"><Plus size={17} /></button>
                </div>
                <button type="button" onClick={handleAddToCart} disabled={!product.inStock || isCartLoading || isAdded} className="hidden min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 font-black text-white shadow-md hover:bg-medical-dark disabled:cursor-not-allowed disabled:bg-slate-300 md:flex">{isCartLoading ? <Loader size={18} className="animate-spin" /> : isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}{product.inStock ? (isAdded ? 'Added to cart' : 'Add to cart') : 'Out of stock'}</button>
                <button type="button" onClick={handleBuyNow} disabled={!product.inStock || isBuyingNow || isCartLoading} className="hidden min-h-12 items-center justify-center rounded-xl border-2 border-medical-accent bg-medical-accent px-4 font-black text-medical-dark shadow-md hover:bg-amber-300 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-medical-text md:flex">{isBuyingNow ? 'Opening cartâ€¦' : 'Buy now'}</button>
              </div>

              {cartError && <p role="alert" className="mt-3 hidden rounded-xl bg-medical-alert bg-opacity-10 px-3 py-2 text-sm font-semibold text-medical-alert md:block">{cartError}</p>}

              {isRentalAvailable(product) && <button type="button" onClick={() => setIsRentalModalOpen(true)} className="mt-3 hidden min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-medical-secondary bg-medical-secondary-soft px-4 font-black text-medical-secondary shadow-sm hover:bg-emerald-100 md:flex"><Calendar size={19} />Enquire about renting this product <ChevronRight size={18} /></button>}

              {!product.inStock && (
                <div className="mt-5 rounded-2xl border border-medical-accent bg-medical-accent bg-opacity-5 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-medical-accent"><RotateCcw size={17} />Ask about availability</h2>
                  <p className="mt-1 text-xs leading-5 text-medical-text">Weâ€™ll open a prefilled availability email for you to send.</p>
                  <form onSubmit={handleNotify} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="flex-1"><span className="sr-only">Your email address</span><input type="email" required value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} placeholder="Your email address" className="min-h-11 w-full rounded-xl border border-medical-accent bg-white px-3 text-sm outline-none focus:border-medical-primary" /></label>
                    <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-accent px-5 text-sm font-bold text-white"><Mail size={17} />Open email request</button>
                  </form>
                  {emailAppOpened && <p role="status" className="mt-2 text-xs font-semibold text-medical-text">Draft opened. Send it to complete your request.</p>}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a href={phoneHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-medical-primary bg-white px-4 font-bold text-medical-primary hover:bg-medical-light"><Phone size={18} />Call about this product</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 font-bold text-white hover:bg-[#1DA851]"><WhatsAppIcon size={19} className="text-white" />WhatsApp product enquiry</a>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-medical-dark"><MapPin size={17} />Delivery enquiry</h2>
              <form onSubmit={handlePincodeCheck} className="mt-3 flex gap-2">
                <label className="flex-1"><span className="sr-only">Six-digit delivery pincode</span><input type="text" inputMode="numeric" autoComplete="postal-code" value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\D/g, '').slice(0, 6)); setPincodeStatus('idle'); }} placeholder="Enter 6-digit pincode" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-medical-primary" /></label>
                <button type="submit" className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-medical-dark hover:bg-slate-50">Check</button>
              </form>
              {pincodeStatus === 'valid' && <p role="status" className="mt-2 text-xs leading-5 text-medical-text">Pincode {pincode} saved. Confirm delivery availability and timing at checkout or with support.</p>}
              {pincodeStatus === 'invalid' && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">Enter a valid six-digit Indian pincode.</p>}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {product.warranty && <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"><ShieldCheck className="shrink-0 text-medical-primary" size={22} /><div><p className="text-sm font-bold text-medical-dark">Warranty listed</p><p className="mt-1 text-xs leading-5 text-medical-text">{product.warranty}. Confirm manufacturer coverage and terms before purchase.</p></div></div>}
              <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"><FileText className="shrink-0 text-medical-primary" size={22} /><div><p className="text-sm font-bold text-medical-dark">GST invoice available</p><p className="mt-1 text-xs leading-5 text-medical-text">Invoice details are collected during checkout.</p></div></div>
            </div>
          </section>
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="flex overflow-x-auto border-b border-slate-200 p-2" role="tablist" aria-label="Product information">
            <button type="button" role="tab" aria-selected={activeTab === 'description'} onClick={() => setActiveTab('description')} className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold ${activeTab === 'description' ? 'bg-medical-primary text-white' : 'text-medical-text hover:bg-slate-50'}`}>Description</button>
            <button type="button" role="tab" aria-selected={activeTab === 'specifications'} onClick={() => setActiveTab('specifications')} className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold ${activeTab === 'specifications' ? 'bg-medical-primary text-white' : 'text-medical-text hover:bg-slate-50'}`}>Specifications</button>
          </div>
          <div className="p-5 sm:p-8">
            {activeTab === 'description' ? (
              safeDescription
                ? <div className="prose prose-sm max-w-none text-medical-text" dangerouslySetInnerHTML={{ __html: safeDescription }} />
                : <div><h2 className="text-lg font-bold text-medical-dark">Product information</h2><p className="mt-2 text-sm leading-6 text-medical-text">Product details are not available yet. Contact us to confirm specifications and compatibility.</p><a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-primary px-4 font-bold text-medical-primary">Request details</a></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <caption className="sr-only">Specifications for {product.title}</caption>
                  <tbody className="divide-y divide-slate-100">
                    <tr><th scope="row" className="w-1/3 py-3 pr-4 font-bold text-medical-dark">Brand</th><td className="py-3 text-medical-text">{product.vendor}</td></tr>
                    <tr><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Product</th><td className="py-3 text-medical-text">{product.title}</td></tr>
                    <tr><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Category</th><td className="py-3 text-medical-text">{product.category}</td></tr>
                    {product.warranty && <tr><th scope="row" className="py-3 pr-4 font-bold text-medical-dark">Listed warranty</th><td className="py-3 text-medical-text">{product.warranty}</td></tr>}
                    {product.metafields?.map((field) => <tr key={`${field.namespace}-${field.key}`}><th scope="row" className="py-3 pr-4 font-bold capitalize text-medical-dark">{field.key.replace(/_/g, ' ')}</th><td className="py-3 text-medical-text">{field.value}</td></tr>)}
                  </tbody>
                </table>
                {!product.metafields?.length && <p className="mt-4 text-xs leading-5 text-medical-text">Additional technical specifications have not been supplied. Confirm requirements with the team before ordering.</p>}
              </div>
            )}
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-12" aria-labelledby="related-products-heading">
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-medical-primary">Continue browsing</p><h2 id="related-products-heading" className="mt-1 text-2xl font-bold text-medical-dark">Related products</h2></div><Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hidden min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-medical-primary hover:bg-medical-light sm:flex">View category<ChevronRight size={17} /></Link></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{relatedProducts.map((relatedProduct) => <ProductCard key={relatedProduct.id} product={relatedProduct} />)}</div>
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
          {isRentalAvailable(product) && <button type="button" onClick={() => setIsRentalModalOpen(true)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-medical-secondary bg-medical-secondary-soft text-medical-secondary" aria-label="Enquire about renting this product"><Calendar size={19} /></button>}
          <button type="button" onClick={handleAddToCart} disabled={!product.inStock || isCartLoading || isAdded} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-medical-primary px-3 text-sm font-bold text-white disabled:bg-slate-300">{isCartLoading ? <Loader size={17} className="animate-spin" /> : isAdded ? <Check size={17} /> : <ShoppingCart size={17} />}{product.inStock ? (isAdded ? 'Added' : 'Add to cart') : 'Out of stock'}</button>
          {product.inStock && <button type="button" onClick={handleBuyNow} disabled={isBuyingNow || isCartLoading} className="min-h-12 flex-1 rounded-xl border border-medical-primary px-3 text-sm font-bold text-medical-primary disabled:border-slate-300 disabled:text-medical-text">{isBuyingNow ? 'Openingâ€¦' : 'Buy now'}</button>}
          {!product.inStock && <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-medical-primary px-3 text-sm font-bold text-medical-primary">Ask availability</a>}
        </div>
      </div>

      <RentalModal product={product} isOpen={isRentalModalOpen} onClose={() => setIsRentalModalOpen(false)} />
    </main>
  );
};

export default ProductDetailPage;
