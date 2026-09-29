import React, { useState, useRef, useId } from 'react';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';

interface WriteReviewModalProps {
  productId: string;
  productHandle?: string;
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor - Did not meet expectations',
  2: 'Fair - Below average performance',
  3: 'Average - Satisfactory basic equipment',
  4: 'Good - Reliable and effective',
  5: 'Excellent - Highly recommended medical equipment',
};

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productHandle,
  productTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addReview } = useReviews();

  const titleId = useId();
  const authorId = useId();
  const emailId = useId();
  const roleId = useId();
  const contentId = useId();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<
    'Healthcare Professional' | 'Home Patient' | 'Caregiver' | 'Clinic / Hospital'
  >('Home Patient');
  const [recommend, setRecommend] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Compress & convert uploaded file to lightweight data URL
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      setErrorMessage('You can upload a maximum of 5 photos per review.');
      return;
    }

    setErrorMessage('');
    try {
      const processed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 8 * 1024 * 1024) {
          setErrorMessage('Each image must be smaller than 8MB.');
          continue;
        }
        const dataUrl = await processImageFile(file);
        processed.push(dataUrl);
      }
      setPhotos((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Error processing image:', err);
      setErrorMessage('Could not process one or more images. Please try another image.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!author.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please give your review a short headline.');
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setErrorMessage('Please share a few details about your experience (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await addReview({
        productId,
        productHandle,
        author: author.trim(),
        email: email.trim().toLowerCase(),
        rating,
        title: title.trim(),
        content: content.trim(),
        userType,
        photos,
        recommend,
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to submit review. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-medical-light sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close review modal"
        >
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-secondary-soft text-medical-secondary">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-bold text-medical-dark">Review Submitted!</h3>
            <p className="text-sm text-medical-text/70 max-w-sm mx-auto">
              Thank you for helping other patients, clinics, and families choose the right medical equipment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-medical-primary">
                Customer Feedback
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-medical-dark mt-1">
                Write a Review for {productTitle}
              </h2>
            </div>

            {errorMessage && (
              <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {errorMessage}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-medical-dark">
                Overall Rating <span className="text-medical-alert">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={28}
                        className={active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  );
                })}
                <span className="ml-3 text-xs font-semibold text-medical-dark">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-medical-dark">
                  Upload Equipment Photos (Optional)
                </label>
                <span className="text-xs text-medical-text/50">{photos.length} / 5 photos</span>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-medical-primary rounded-2xl p-5 text-center bg-slate-50 hover:bg-medical-light/30 transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-medical-primary group-hover:scale-110 transition shadow-2xs">
                    <Camera size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-medical-primary">
                      Click to add photos of the equipment
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Show the setup in your clinic or home (PNG, JPG up to 8MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos Preview Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                  {photos.map((src, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={src}
                        alt={`Review upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition opacity-90 group-hover:opacity-100"
                        title="Remove photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Title */}
            <div>
              <label htmlFor={titleId} className="block text-xs font-bold uppercase tracking-wider text-medical-dark mb-1.5">
                Review Headline <span className="text-medical-alert">*</span>
              </label>
              <input
                id={titleId}
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reliable, quiet operation and easy to use at home"
                className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm text-medical-dark focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/20 outline-none transition"
              />
            </div>

            {/* Detailed Content */}
            <div>
              <label htmlFor={contentId} className="block text-xs font-bold uppercase tracking-wider text-medical-dark mb-1.5">
                Your Review <span className="text-medical-alert">*</span>
              </label>
              <textarea
                id={contentId}
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How has this equipment performed? Mention build quality, ease of cleaning, accuracy, and support experience..."
                className="w-full rounded-xl border border-slate-300 p-4 text-sm text-medical-dark focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/20 outline-none transition"
              />
            </div>

            {/* Reviewer Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={authorId} className="block text-xs font-bold uppercase tracking-wider text-medical-dark mb-1.5">
                  Your Name <span className="text-medical-alert">*</span>
                </label>
                <input
                  id={authorId}
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Dr. Rajesh or Ananya M."
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm text-medical-dark focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/20 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor={emailId} className="block text-xs font-bold uppercase tracking-wider text-medical-dark mb-1.5">
                  Email Address <span className="text-medical-alert">*</span>
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm text-medical-dark focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/20 outline-none transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Your email will not be displayed publicly.</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={roleId} className="block text-xs font-bold uppercase tracking-wider text-medical-dark mb-1.5">
                  I am a...
                </label>
                <select
                  id={roleId}
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as any)}
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm text-medical-dark bg-white focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/20 outline-none transition"
                >
                  <option value="Home Patient">Home Care Patient / Family Member</option>
                  <option value="Healthcare Professional">Healthcare Professional (Doctor / Surgeon / Nurse)</option>
                  <option value="Caregiver">Professional Caregiver / Nurse</option>
                  <option value="Clinic / Hospital">Clinic / Hospital Administrator</option>
                </select>
              </div>
            </div>

            {/* Recommendation Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="recommend-toggle"
                type="checkbox"
                checked={recommend}
                onChange={(e) => setRecommend(e.target.checked)}
                className="w-5 h-5 rounded text-medical-primary border-slate-300 focus:ring-medical-primary"
              />
              <label htmlFor="recommend-toggle" className="text-xs font-semibold text-medical-dark cursor-pointer select-none">
                I recommend this equipment to other patients, doctors, and hospitals
              </label>
            </div>

            {/* Submit CTA */}
            <div className="flex gap-3 pt-4 border-t border-medical-light">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-medical-primary hover:bg-medical-dark text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
