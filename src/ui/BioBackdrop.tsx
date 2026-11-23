import React from 'react';
import { OrganZone } from '../types/game';

interface BioBackdropProps {
  zone?: OrganZone;
  variant?: 'menu' | 'map' | 'ambient';
}

const ZONE_GRADIENTS: Record<OrganZone, string> = {
  skin: 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 45%, #fce7f3 100%)',
  throat: 'linear-gradient(180deg, #ede9fe 0%, #dbeafe 50%, #ccfbf1 100%)',
  lungs: 'linear-gradient(180deg, #cffafe 0%, #e0f2fe 52%, #ecfeff 100%)',
  gut: 'linear-gradient(180deg, #d1fae5 0%, #cffafe 50%, #fef3c7 100%)',
  blood: 'linear-gradient(180deg, #ffe4e6 0%, #fce7f3 48%, #e0f2fe 100%)',
  lymph: 'linear-gradient(180deg, #ecfdf5 0%, #cffafe 48%, #e0e7ff 100%)',
};

/**
 * Bright, friendly cartoon medical/internal-body backdrop with soft glowing vessels,
 * stylized blood cell silhouettes, and clean laboratory bokeh.
 */
export const BioBackdrop: React.FC<BioBackdropProps> = ({
  zone = 'lungs',
  variant = 'menu',
}) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: ZONE_GRADIENTS[zone] }}
      />

      {/* Soft glowing cellular bokeh */}
      <div
        className="absolute -top-12 -left-10 h-56 w-56 rounded-full opacity-55 blur-xl"
        style={{ background: 'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 72%)' }}
      />
      <div
        className="absolute top-1/4 -right-12 h-64 w-64 rounded-full opacity-45 blur-xl"
        style={{ background: 'radial-gradient(circle, #7dd3fc 0%, rgba(125,211,252,0) 72%)' }}
      />

      {/* Stylized friendly internal vessels & cell silhouettes */}
      <svg
        viewBox="0 0 800 900"
        className={`absolute inset-0 h-full w-full ${
          variant === 'ambient' ? 'opacity-45' : 'opacity-75'
        }`}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Soft flowing vessel ribbons */}
        <path
          d="M-40 180 Q210 110 420 200 T860 150"
          fill="none"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="44"
          strokeLinecap="round"
        />
        <path
          d="M-30 680 Q240 590 470 670 T850 610"
          fill="none"
          stroke="rgba(56, 189, 248, 0.18)"
          strokeWidth="58"
          strokeLinecap="round"
        />

        {/* Friendly floating cell rings */}
        <circle cx="120" cy="145" r="28" fill="rgba(255,255,255,0.5)" stroke="#ffffff" strokeWidth="3" />
        <circle cx="120" cy="145" r="11" fill="rgba(56,189,248,0.28)" />

        <circle cx="670" cy="210" r="34" fill="rgba(255,255,255,0.45)" stroke="#ffffff" strokeWidth="3" />
        <circle cx="670" cy="210" r="14" fill="rgba(244,114,182,0.22)" />

        <circle cx="160" cy="720" r="38" fill="rgba(255,255,255,0.48)" stroke="#ffffff" strokeWidth="3" />
        <circle cx="160" cy="720" r="15" fill="rgba(45,212,191,0.25)" />

        <circle cx="640" cy="760" r="26" fill="rgba(255,255,255,0.5)" stroke="#ffffff" strokeWidth="3" />

        {/* Subtle medical cross watermark */}
        <g transform="translate(650, 95)" opacity="0.22">
          <rect x="-8" y="-22" width="16" height="44" rx="5" fill="#0284c7" />
          <rect x="-22" y="-8" width="44" height="16" rx="5" fill="#0284c7" />
        </g>
      </svg>
    </div>
  );
};
