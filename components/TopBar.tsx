import React from 'react';
import { Phone, Zap } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';

const TopBar: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800 selection:bg-medical-primary selection:text-white">
      <div className="container mx-auto px-3 sm:px-4">
        {/* MOBILE VIEW (< 640px) */}
        <div className="flex sm:hidden items-center justify-between py-1.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-1 font-semibold text-white text-[11px] bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
              <Zap size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
              <span>US Nationwide</span>
            </span>
            <span className="text-slate-400 text-[11px] truncate">Express &amp; Ground Delivery</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={`tel:${CONTACT_PHONE.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md border border-slate-700/60 transition-colors"
              aria-label={`Call ${CONTACT_PHONE}`}
            >
              <Phone size={11} className="text-slate-300" />
              <span>Call Toll-Free</span>
            </a>
          </div>
        </div>

        {/* DESKTOP / TABLET VIEW (>= 640px) */}
        <div className="hidden sm:flex items-center justify-between py-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span className="text-white font-medium">Nationwide US Shipping:</span>
            <span className="text-slate-300">Free Ground on Orders $99+ | Express 2-Day &amp; Priority Overnight Available</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <a
              href={`tel:${CONTACT_PHONE.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
              aria-label={`Call ${CONTACT_PHONE}`}
            >
              <Phone size={13} className="text-slate-400" />
              <span>{CONTACT_PHONE}</span>
            </a>
            
            <span className="text-slate-700">|</span>

            <span className="text-slate-400 text-[11px]">Mon–Fri 8am–8pm EST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;




