import React from 'react';
import { Phone, Zap } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import WhatsAppIcon from './WhatsAppIcon';

const TopBar: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white border-b border-emerald-500/25 shadow-inner">
      <div className="container mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Left: Emergency Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
          </span>
          
          {/* Mobile Text (Short, fits on 320px-390px screens) */}
          <div className="flex items-center gap-1 text-[11px] sm:hidden truncate font-medium">
            <Zap size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-emerald-300 font-bold">Hyd 60-90m</span>
            <span className="text-slate-300 truncate">Emergency Dispatch</span>
          </div>

          {/* Desktop / Tablet Text (Full Expanded) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1 flex-shrink-0">
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Hyderabad Express:</span>
            </span>
            <span className="text-slate-200 font-medium">
              Instant 60–90 Min Emergency Delivery (Oxygen &amp; Critical Care)
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons (Always 1-line on mobile) */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
            className="flex items-center gap-1 font-bold text-amber-300 hover:text-white transition-colors bg-white/10 hover:bg-emerald-600/30 px-2 py-0.5 rounded-full border border-amber-300/30 text-[10px] sm:text-xs"
            aria-label={`Call Emergency Helpline ${CONTACT_PHONE}`}
          >
            <Phone size={11} className="text-amber-400 animate-bounce sm:w-3 sm:h-3" />
            <span className="hidden min-[480px]:inline">Call:</span>
            <span className="sm:inline">{CONTACT_PHONE}</span>
          </a>
          
          <a
            href="https://wa.me/919390349389?text=Hi%20BaeMeds,%20I%20urgently%20need%20medical%20equipment%20in%20Hyderabad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition-colors bg-emerald-950/80 hover:bg-emerald-800/40 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px] sm:text-xs"
            aria-label="WhatsApp Emergency Desk"
          >
            <WhatsAppIcon size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default TopBar;


