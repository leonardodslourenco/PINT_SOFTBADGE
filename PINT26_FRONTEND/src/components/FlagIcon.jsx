import React from 'react';

export default function FlagIcon({ lang, size = 18 }) {
  const code = String(lang).toLowerCase();

  // PT Flag SVG
  if (code === 'pt') {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 600 400" 
        width={size} 
        height={(size * 2) / 3}
        className="rounded shadow-sm"
        style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
      >
        <rect width="240" height="400" fill="#006600"/>
        <rect x="240" width="360" height="400" fill="#FF0000"/>
        <circle cx="240" cy="200" r="80" fill="#FFD700"/>
        <circle cx="240" cy="200" r="55" fill="#0000FF"/>
        <path d="M 240 120 L 240 280 M 160 200 L 320 200" stroke="#FFD700" strokeWidth="8"/>
        <rect x="215" y="165" width="50" height="70" fill="#FFFFFF" stroke="#FF0000" strokeWidth="6"/>
      </svg>
    );
  }

  // EN Flag SVG (United Kingdom / Union Jack)
  if (code === 'en' || code === 'gb') {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 60 30" 
        width={size} 
        height={size / 2}
        className="rounded shadow-sm"
        style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
      >
        <clipPath id="s">
          <path d="M0,0 L60,0 L60,30 L0,30 Z"/>
        </clipPath>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" clipPath="url(#s)"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="4" clipPath="url(#s)"/>
        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#c8102e" strokeWidth="6"/>
      </svg>
    );
  }

  // ES Flag SVG
  if (code === 'es') {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 750 500" 
        width={size} 
        height={(size * 2) / 3}
        className="rounded shadow-sm"
        style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
      >
        <rect width="750" height="500" fill="#c11b17"/>
        <rect y="125" width="750" height="250" fill="#fcd116"/>
        <circle cx="200" cy="250" r="45" fill="#c11b17"/>
        <rect x="185" y="215" width="30" height="50" fill="#fcd116"/>
      </svg>
    );
  }

  return <span className="small fw-bold">{lang.toUpperCase()}</span>;
}
