import React from 'react';
import { Phone, Zap } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import WhatsAppIcon from './WhatsAppIcon';

const TopBar: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800 selection:bg-medical-primary selection:text-white">
      <div className="container mx-auto px-3 sm:px-4">
        
        {/* ========================================================================= */}
        {/* MOBILE VIEW (< 640px) - Custom Tailored Touch Layout                      */}
        {/* ========================================================================= */}
        <div className="flex sm:hidden items-center justify-between py-1.5 gap-2">
          {/* Left: Mobile Dispatch Pill */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-1 font-semibold text-white text-[11px] bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
              <Zap size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
              <span>Hyd 60–90m</span>
            </span>
            <span className="text-slate-400 text-[11px] truncate">Emergency Delivery</span>
          </div>

          {/* Right: Mobile Touch CTAs */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md border border-slate-700/60 transition-colors"
              aria-label={`Call ${CONTACT_PHONE}`}
            >
              <Phone size={11} className="text-slate-300" />
              <span>Call</span>
            </a>

            <a
              href="https://wa.me/919390349389?text=Hi%20BaeMeds,%20I%20urgently%20need%20medical%20equipment%20in%20Hyderabad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 px-2 py-1 rounded-md border border-emerald-800/50 transition-colors"
              aria-label="WhatsApp Emergency Chat"
            >
              <WhatsAppIcon size={12} />
              <span>Chat</span>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP / TABLET VIEW (>= 640px) - Spacious Minimalist Healthcare Layout  */}
        {/* ========================================================================= */}
        <div className="hidden sm:flex items-center justify-between py-2 gap-4">
          {/* Left: Desktop Notice */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span className="text-white font-medium">Hyderabad:</span>
            <span className="text-slate-300">Instant 60–90 Min Emergency Delivery (Oxygen &amp; Critical Care)</span>
          </div>

          {/* Right: Desktop Contacts */}
          <div className="flex items-center gap-4 text-slate-300">
            <a
              href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
              aria-label={`Call ${CONTACT_PHONE}`}
            >
              <Phone size={13} className="text-slate-400" />
              <span>{CONTACT_PHONE}</span>
            </a>
            
            <span className="text-slate-700">|</span>

            <a
              href="https://wa.me/919390349389?text=Hi%20BaeMeds,%20I%20urgently%20need%20medical%20equipment%20in%20Hyderabad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
              aria-label="WhatsApp Contact"
            >
              <WhatsAppIcon size={14} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TopBar;




