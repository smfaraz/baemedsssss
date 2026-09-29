import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductReview, INITIAL_SEED_REVIEWS } from '../lib/seedReviews';
import { supabase } from '../lib/supabase';

export type { ProductReview };

export interface ReviewSummary {
  rating: number;
  count: number;
  breakdown: Record<number, number>; // count per star (1-5)
  recommendedPercentage: number;
  photoCount: number;
}

export interface NewReviewInput {
  productId: string;
  productHandle?: string;
  author: string;
  email: string;
  rating: number;
  title: string;
  content: string;
  userType?: 'Healthcare Professional' | 'Home Patient' | 'Caregiver' | 'Clinic / Hospital';
  photos: string[];
  recommend: boolean;
}

interface ReviewsContextType {
  reviews: ProductReview[];
  getReviews: (productIdOrHandle: string) => ProductReview[];
  addReview: (input: NewReviewInput) => Promise<ProductReview>;
  voteHelpful: (reviewId: string) => void;
  hasVotedHelpful: (reviewId: string) => boolean;
  getReviewsSummary: (productId: string, fallbackRating?: number, fallbackCount?: number) => ReviewSummary;
}

const STORAGE_KEY = 'baemeds_customer_reviews_us_v1';
const VOTES_STORAGE_KEY = 'baemeds_voted_reviews_us_v1';

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SEED_REVIEWS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge user custom reviews with seed reviews, de-duplicating by id
          const ids = new Set(parsed.map((r: ProductReview) => r.id));
          const merged = [...parsed, ...INITIAL_SEED_REVIEWS.filter((r) => !ids.has(r.id))];
          return merged;
        }
      }
    } catch (e) {
      console.warn('Error reading reviews from localStorage:', e);
    }
    return INITIAL_SEED_REVIEWS;
  });

  const [votedReviews, setVotedReviews] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(VOTES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever reviews change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Error persisting reviews to localStorage:', e);
    }
  }, [reviews]);

  // Save votes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votedReviews));
    } catch (e) {
      console.warn('Error persisting voted reviews:', e);
    }
  }, [votedReviews]);

  // Matches strictly against specific product ID, numeric ID, or handle - NO generic fallback!
  const getReviews = (productIdOrHandle: string): ProductReview[] => {
    if (!productIdOrHandle) return [];
    const clean = String(productIdOrHandle).trim().toLowerCase();
    const numericPart = clean.split('/').pop() || clean;

    return reviews.filter((r) => {
      // 1. Exact match on full GID or clean ID
      if (r.productId.toLowerCase() === clean) return true;
      // 2. Match numeric suffix (e.g. 10000007790837)
      const rNum = (r.productId.split('/').pop() || r.productId).toLowerCase();
      if (rNum === numericPart) return true;
      // 3. Match handle if available
      if (r.productHandle && r.productHandle.toLowerCase() === clean) return true;
      return false;
    });
  };

  const addReview = async (input: NewReviewInput): Promise<ProductReview> => {
    const today = new Date().toISOString().split('T')[0];
    const newReview: ProductReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: input.productId,
      productHandle: input.productHandle,
      author: input.author.trim() || 'Verified Customer',
      email: input.email.trim().toLowerCase(),
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      title: input.title.trim(),
      content: input.content.trim(),
      date: today,
      verified: true,
      userType: input.userType || 'Home Patient',
      photos: Array.isArray(input.photos) ? input.photos : [],
      recommend: Boolean(input.recommend),
      helpfulCount: 0,
    };

    setReviews((prev) => [newReview, ...prev]);

    // Optional background sync to Supabase if table exists
    try {
      supabase
        .from('product_reviews')
        .insert({
          id: newReview.id,
          product_id: newReview.productId,
          author: newReview.author,
          email: newReview.email,
          rating: newReview.rating,
          title: newReview.title,
          content: newReview.content,
          photos: newReview.photos,
          recommend: newReview.recommend,
          user_type: newReview.userType,
        })
        .then(({ error }) => {
          if (error) console.info('Supabase review background sync notice:', error.message);
        });
    } catch {
      // Ignored: local storage is the primary resilient source
    }

    return newReview;
  };

  const hasVotedHelpful = (reviewId: string): boolean => {
    return votedReviews.includes(reviewId);
  };

  const voteHelpful = (reviewId: string) => {
    if (hasVotedHelpful(reviewId)) return;

    setVotedReviews((prev) => [...prev, reviewId]);
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      )
    );
  };

  const getReviewsSummary = (
    productId: string,
    fallbackRating: number = 0,
    fallbackCount: number = 0
  ): ReviewSummary => {
    const items = getReviews(productId);

    if (items.length > 0) {
      const totalRating = items.reduce((acc, curr) => acc + curr.rating, 0);
      const avg = Math.round((totalRating / items.length) * 10) / 10;

      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let recommendCount = 0;
      let photoCount = 0;

      items.forEach((r) => {
        if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
        if (r.recommend) recommendCount++;
        if (r.photos && r.photos.length > 0) photoCount += r.photos.length;
      });

      const recommendedPercentage = Math.round((recommendCount / items.length) * 100);

      return {
        rating: avg,
        count: items.length,
        breakdown,
        recommendedPercentage,
        photoCount,
      };
    }

    // Fallback to product rating metadata only if specifically provided
    const hasValidFallback =
      Number.isFinite(fallbackRating) &&
      Number.isFinite(fallbackCount) &&
      fallbackRating > 0 &&
      fallbackRating <= 5 &&
      fallbackCount > 0;

    if (hasValidFallback) {
      const baseCount = Math.floor(fallbackCount);
      return {
        rating: fallbackRating,
        count: baseCount,
        breakdown: {
          5: Math.round(baseCount * 0.8),
          4: Math.round(baseCount * 0.15),
          3: Math.round(baseCount * 0.05),
          2: 0,
          1: 0,
        },
        recommendedPercentage: 98,
        photoCount: 0,
      };
    }

    return {
      rating: 0,
      count: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recommendedPercentage: 0,
      photoCount: 0,
    };
  };

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        getReviews,
        addReview,
        voteHelpful,
        hasVotedHelpful,
        getReviewsSummary,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within a ReviewsProvider');
  return context;
};
