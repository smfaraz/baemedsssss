import React, { useState, useMemo } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  PenSquare,
  Share2,
  ShieldCheck,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Product } from '../../types';
import { useReviews, ProductReview } from '../../context/ReviewsContext';
import { WriteReviewModal } from './WriteReviewModal';

interface ProductReviewsSectionProps {
  product: Product;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ product }) => {
  const { getReviews, getReviewsSummary, voteHelpful, hasVotedHelpful } = useReviews();

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [onlyPhotosFilter, setOnlyPhotosFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');

  // Lightbox Modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    author: string;
    title: string;
    rating: number;
    date: string;
  } | null>(null);

  const reviews = getReviews(product.id);
  const summary = getReviewsSummary(product.id, product.rating, product.reviewCount);

  // Collect all photos from all reviews for this product
  const allCustomerPhotos = useMemo(() => {
    const list: Array<{
      url: string;
      review: ProductReview;
    }> = [];
    reviews.forEach((r) => {
      if (Array.isArray(r.photos)) {
        r.photos.forEach((url) => {
          list.push({ url, review: r });
        });
      }
    });
    return list;
  }, [reviews]);

  // Filtered & Sorted reviews
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (starFilter !== 'all') {
      list = list.filter((r) => r.rating === starFilter);
    }

    if (onlyPhotosFilter) {
      list = list.filter((r) => r.photos && r.photos.length > 0);
    }

    list.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'highest') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lowest') {
        return a.rating - b.rating;
      }
      if (sortBy === 'helpful') {
        return b.helpfulCount - a.helpfulCount;
      }
      return 0;
    });

    return list;
  }, [reviews, starFilter, onlyPhotosFilter, sortBy]);

  if (reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-medical-light bg-gradient-to-br from-white via-white to-medical-light/30 p-8 sm:p-12 shadow-soft text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-medical-light flex items-center justify-center mx-auto text-medical-primary mb-4">
            <MessageSquare size={30} />
          </div>
          <h3 className="text-xl font-bold text-medical-dark">No reviews yet for this product</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Have you purchased or used the <span className="font-semibold text-medical-dark">{product.title}</span>? Share your feedback, clinical insights, and equipment photos to help other hospitals, clinics, and patients make informed decisions.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="min-h-12 px-6 rounded-2xl bg-medical-primary hover:bg-medical-dark text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:shadow-md transition active:scale-98"
            >
              <PenSquare size={16} /> Write the First Review
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400 flex items-center justify-center gap-1">
            <Camera size={13} /> You can upload photos of your equipment setup
          </p>
        </div>

        <WriteReviewModal
          productId={product.id}
          productHandle={product.handle}
          productTitle={product.title}
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Reviews Dashboard Card */}
      <div className="rounded-3xl border border-medical-light bg-gradient-to-br from-white via-white to-medical-light/30 p-6 sm:p-8 shadow-soft">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr_220px] lg:items-center">
          {/* Rating Big Display */}
          <div className="text-center lg:text-left border-b lg:border-b-0 lg:border-r border-medical-light pb-6 lg:pb-0 lg:pr-8">
            <div className="flex items-baseline justify-center lg:justify-start gap-2">
              <span className="text-5xl font-black text-medical-dark">{summary.rating.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </div>
            <div className="mt-2 flex items-center justify-center lg:justify-start gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={star <= Math.round(summary.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-medical-text/70">
              Based on {summary.count} verified review{summary.count === 1 ? '' : 's'}
            </p>
            {summary.recommendedPercentage > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-medical-secondary-soft px-3 py-1 text-xs font-bold text-medical-secondary">
                <CheckCircle2 size={13} /> {summary.recommendedPercentage}% recommend this
              </div>
            )}
          </div>

          {/* Star Distribution Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.breakdown[star] || 0;
              const percentage = summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
              const isSelected = starFilter === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarFilter(starFilter === star ? 'all' : star)}
                  className={`w-full flex items-center gap-3 text-xs group transition rounded-lg px-2 py-1 ${
                    isSelected ? 'bg-medical-light font-bold' : 'hover:bg-slate-50'
                  }`}
                  title={`Filter by ${star} star reviews`}
                >
                  <span className="w-12 text-left font-bold text-slate-600 flex items-center gap-1">
                    {star} <Star size={12} className="fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500 group-hover:bg-amber-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-slate-400 font-medium">
                    {count} ({percentage}%)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Write Review CTA */}
          <div className="flex flex-col items-center justify-center gap-3 text-center border-t lg:border-t-0 lg:border-l border-medical-light pt-6 lg:pt-0 lg:pl-6">
            <p className="text-xs font-semibold text-slate-500">Own or use this medical device?</p>
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="w-full min-h-12 rounded-2xl bg-medical-primary hover:bg-medical-dark text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:shadow-md transition active:scale-98"
            >
              <PenSquare size={16} /> Write a Review
            </button>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Camera size={12} /> Photo uploads welcomed
            </p>
          </div>
        </div>
      </div>

      {/* Customer Photos Strip Gallery */}
      {allCustomerPhotos.length > 0 && (
        <div className="rounded-3xl border border-medical-light bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-medical-dark flex items-center gap-2">
              <Camera size={16} className="text-medical-primary" />
              Customer Equipment Photos ({allCustomerPhotos.length})
            </h3>
            <button
              type="button"
              onClick={() => setOnlyPhotosFilter(!onlyPhotosFilter)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                onlyPhotosFilter
                  ? 'bg-medical-primary text-white border-medical-primary'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {onlyPhotosFilter ? 'Showing with photos' : 'Filter by photos'}
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {allCustomerPhotos.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setLightboxPhoto({
                    url: item.url,
                    author: item.review.author,
                    title: item.review.title,
                    rating: item.review.rating,
                    date: item.review.date,
                  })
                }
                className="relative group aspect-square w-24 sm:w-28 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-medical-primary transition"
                title={`View photo by ${item.review.author}`}
              >
                <img
                  src={item.url}
                  alt={`Customer equipment upload by ${item.review.author}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                    Zoom
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-medical-light">
        {/* Star rating chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStarFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              starFilter === 'all'
                ? 'bg-medical-dark text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                starFilter === s
                  ? 'bg-medical-dark text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s} <Star size={11} className="fill-amber-400 text-amber-400" /> ({summary.breakdown[s] || 0})
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-medical-dark outline-none focus:border-medical-primary transition"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-medical-light p-8">
            <p className="text-base font-bold text-medical-dark">No reviews match your selected filter</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting a different rating or clear your filter.</p>
            <button
              type="button"
              onClick={() => {
                setStarFilter('all');
                setOnlyPhotosFilter(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-medical-light text-medical-primary text-xs font-bold hover:bg-medical-light/80 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const hasVoted = hasVotedHelpful(review.id);

            return (
              <article
                key={review.id}
                className="rounded-3xl border border-medical-light bg-white p-6 sm:p-7 shadow-soft space-y-4 transition hover:shadow-md"
              >
                {/* Header: Author, Rating, Date */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-medical-dark">{review.author}</span>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-medical-secondary bg-medical-secondary-soft px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} /> Verified Buyer
                        </span>
                      )}
                      {review.userType && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {review.userType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">·</span>
                      <time className="text-xs text-slate-400">{review.date}</time>
                    </div>
                  </div>

                  {review.recommend && (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={13} /> Recommends equipment
                    </div>
                  )}
                </div>

                {/* Review Headline & Content */}
                <div>
                  <h4 className="font-bold text-base text-medical-dark leading-snug">{review.title}</h4>
                  <p className="mt-2 text-sm text-medical-text/80 leading-relaxed whitespace-pre-line">
                    {review.content}
                  </p>
                </div>

                {/* Review Photos Gallery */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {review.photos.map((src, photoIdx) => (
                      <button
                        key={photoIdx}
                        type="button"
                        onClick={() =>
                          setLightboxPhoto({
                            url: src,
                            author: review.author,
                            title: review.title,
                            rating: review.rating,
                            date: review.date,
                          })
                        }
                        className="group relative aspect-square w-20 sm:w-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-medical-primary transition"
                      >
                        <img
                          src={src}
                          alt={`${review.title} photo ${photoIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer: Helpful Vote */}
                <div className="pt-3 border-t border-medical-light/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Was this review helpful?</span>
                  <button
                    type="button"
                    onClick={() => voteHelpful(review.id)}
                    disabled={hasVoted}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                      hasVoted
                        ? 'bg-medical-secondary-soft text-medical-secondary'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <ThumbsUp size={13} className={hasVoted ? 'fill-current' : ''} />
                    <span>{hasVoted ? 'Helpful' : 'Helpful'} ({review.helpfulCount})</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={product.id}
        productHandle={product.handle}
        productTitle={product.title}
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
      />

      {/* Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
              aria-label="Close photo"
            >
              <X size={20} />
            </button>

            <div className="max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="p-5 sm:p-6 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-white">{lightboxPhoto.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uploaded by {lightboxPhoto.author} · {lightboxPhoto.date}
                  </p>
                </div>
                <div className="flex text-amber-400 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= lightboxPhoto.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
