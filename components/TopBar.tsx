import React from 'react';
import { FileText, Phone, Truck } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import WhatsAppIcon from './WhatsAppIcon';

const TopBar: React.FC = () => {
  return (
    <div className="bg-medical-dark px-4 text-xs text-white sm:text-sm">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
            className="tap-target flex items-center gap-1.5 hover:text-medical-accent"
            aria-label={`Call ${CONTACT_PHONE}`}
          >
            <Phone size={14} />
            <span className="hidden min-[380px]:inline">{CONTACT_PHONE}</span>
            <span className="min-[380px]:hidden">Call</span>
          </a>
          <a
            href="https://wa.me/919390349389"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex items-center gap-1.5 hover:text-medical-accent"
          >
            <WhatsAppIcon size={15} />
            <span>WhatsApp</span>
          </a>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/85 sm:gap-4 sm:text-xs">
          <span className="flex items-center gap-1">
            <Truck size={14} />
            <span className="hidden sm:inline">Delivery details at checkout</span>
            <span className="sm:hidden">Delivery at checkout</span>
          </span>
          <span className="flex items-center gap-1">
            <FileText size={14} />
            <span className="hidden sm:inline">GST billing help</span>
            <span className="sm:hidden">GST help</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
