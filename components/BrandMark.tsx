import React from 'react';
import { APP_NAME } from '../constants';

interface BrandMarkProps {
  inverse?: boolean;
  compact?: boolean;
  className?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ inverse = false, compact = false, className = '' }) => (
  <span className={`inline-flex items-center tracking-tight font-black ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} ${className}`}>
    <span className={inverse ? 'text-white' : 'text-medical-dark'}>Bae</span>
    <span className="text-medical-primary">Meds</span>
    <span className="ml-0.5 text-medical-accent">.</span>
  </span>
);

export default BrandMark;
