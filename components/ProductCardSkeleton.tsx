import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div aria-hidden="true" className="flex h-full min-h-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-square animate-pulse bg-slate-100 p-5">
        <div className="h-full w-full rounded-xl bg-slate-200" />
        <div className="absolute left-3 top-3 h-6 w-20 rounded-full bg-slate-300" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-4 w-28 animate-pulse rounded bg-slate-200" />

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="space-y-2">
            <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
