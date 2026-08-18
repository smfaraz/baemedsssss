import React, { createContext, useContext } from 'react';

interface ReviewSummary {
  rating: number;
  count: number;
}

interface ReviewsContextType {
  getReviewsSummary: (productId: string, fallbackRating: number, fallbackCount: number) => ReviewSummary;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getReviewsSummary = (_productId: string, fallbackRating: number, fallbackCount: number): ReviewSummary => {
    const hasVerifiedShopifyRating = Number.isFinite(fallbackRating)
      && Number.isFinite(fallbackCount)
      && fallbackRating > 0
      && fallbackRating <= 5
      && fallbackCount > 0;
    return hasVerifiedShopifyRating
      ? { rating: fallbackRating, count: Math.floor(fallbackCount) }
      : { rating: 0, count: 0 };
  };

  return (
    <ReviewsContext.Provider value={{ getReviewsSummary }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within a ReviewsProvider');
  return context;
};
