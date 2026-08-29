import React from 'react';
import { Phone, Zap } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import WhatsAppIcon from './WhatsAppIcon';

const TopBar: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 px-3 py-1.5 text-xs text-white border-b border-emerald-500/25 shadow-inner">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Emergency Hyderabad Delivery Badge */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Hyderabad Express:</span>
            </span>
            <span className="text-slate-200 font-medium">
              Instant 60–90 Min Emergency Delivery (Oxygen &amp; Critical Care)
            </span>
          </div>
        </div>

        {/* Right: Instant Call & WhatsApp CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto sm:ml-0">
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 font-bold text-amber-300 hover:text-white transition-colors bg-white/10 hover:bg-emerald-600/30 px-2.5 py-0.5 rounded-full border border-amber-300/30 text-[11px] sm:text-xs"
            aria-label={`Call Emergency Helpline ${CONTACT_PHONE}`}
          >
            <Phone size={12} className="text-amber-400 animate-bounce" />
            <span>Call: {CONTACT_PHONE}</span>
          </a>
          
          <a
            href="https://wa.me/919390349389?text=Hi%20BaeMeds,%20I%20urgently%20need%20medical%20equipment%20in%20Hyderabad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition-colors bg-emerald-950/60 hover:bg-emerald-800/40 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px] sm:text-xs"
            aria-label="WhatsApp Emergency Desk"
          >
            <WhatsAppIcon size={13} />
            <span className="hidden min-[400px]:inline">WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default TopBar;

