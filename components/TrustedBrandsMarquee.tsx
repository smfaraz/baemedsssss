import React, { useState } from 'react';
import { TRUSTED_BRANDS, TrustedBrand } from '../constants';
import { Link } from '../context/CartContext';
import { ShieldCheck, Award } from 'lucide-react';

interface BrandCardProps {
  brand: TrustedBrand;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <Link
      to={`/products?search=${encodeURIComponent(brand.searchQuery)}`}
      className="group mx-3 flex h-20 w-44 sm:w-52 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-5 py-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-md sm:h-22"
      title={`Browse ${brand.name} products — ${brand.tagline}`}
    >
      {!hasError ? (
        <img
          src={brand.logo}
          alt={`${brand.name} logo`}
          loading="lazy"
          className="max-h-10 w-full object-contain filter grayscale opacity-75 contrast-125 transition-all duration-300 group-hover:filter-none group-hover:opacity-100 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-center font-bold text-xs uppercase tracking-wider text-slate-700 group-hover:text-medical-primary">
          {brand.name}
        </span>
      )}
    </Link>
  );
};

export const TrustedBrandsMarquee: React.FC = () => {
  return (
    <section
      aria-label="Trusted Medical Brands"
      className="relative overflow-hidden border-y border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-50 py-10 sm:py-12"
    >
      <div className="container mx-auto px-4 mb-6 sm:mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1 text-xs font-bold text-teal-800 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Authorized Equipment &amp; OEM Standards</span>
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          Trusted Global &amp; US Medical Brands
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-slate-600">
          Hospital-grade, factory-sealed equipment from certified medical device manufacturers, backed by full manufacturer warranties and itemized FSA/HSA invoicing.
        </p>
      </div>

      {/* Marquee Container with Left & Right Gradient Fades */}
      <div className="relative w-full overflow-hidden marquee-track">
        {/* Left Gradient Mask */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 sm:w-28 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent"
          aria-hidden="true"
        />

        {/* Marquee Track */}
        <div className="marquee flex items-center py-2">
          {/* Double array ensures seamless loop without break */}
          {[...TRUSTED_BRANDS, ...TRUSTED_BRANDS].map((brand, index) => (
            <BrandCard key={`${brand.name}-${index}`} brand={brand} />
          ))}
        </div>

        {/* Right Gradient Mask */}
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 sm:w-28 bg-gradient-to-l from-slate-50 via-slate-50/90 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 px-4 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <Award size={14} className="text-teal-600" />
          100% Factory-Sealed OEM Devices
        </span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          Official 1–5 Year Manufacturer Warranties
        </span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span className="flex items-center gap-1.5">
          <Award size={14} className="text-teal-600" />
          FSA &amp; HSA Eligible Documentation
        </span>
      </div>
    </section>
  );
};

export default TrustedBrandsMarquee;
