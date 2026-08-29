import React from 'react';
import { Phone } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import WhatsAppIcon from './WhatsAppIcon';

const TopBar: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        
        {/* Left: Clean Delivery Notice */}
        <div className="flex items-center gap-2 truncate">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
          <span className="text-white font-medium">Hyderabad:</span>
          <span className="text-slate-300 truncate">60–90 Min Emergency Delivery Available</span>
        </div>

        {/* Right: Direct Contact */}
        <div className="flex items-center gap-4 flex-shrink-0 text-slate-300">
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            aria-label={`Call ${CONTACT_PHONE}`}
          >
            <Phone size={13} className="text-slate-400" />
            <span className="hidden sm:inline">{CONTACT_PHONE}</span>
            <span className="sm:hidden">Call</span>
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
  );
};

export default TopBar;



