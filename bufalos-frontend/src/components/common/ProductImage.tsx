import React, { useState } from 'react';
import { Shield, Crosshair } from 'lucide-react';

export const TACTICAL_DEFAULT_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450' fill='none'%3e%3crect width='600' height='450' fill='%23120924'/%3e%3cpath d='M0 0l600 450M600 0L0 450' stroke='%23251442' stroke-width='1.5' stroke-dasharray='6 6'/%3e%3ccircle cx='300' cy='210' r='110' stroke='%23f59e0b' stroke-opacity='0.25' stroke-width='2' stroke-dasharray='4 4'/%3e%3ccircle cx='300' cy='210' r='75' stroke='%23f59e0b' stroke-opacity='0.35' stroke-width='2'/%3e%3cpath d='M300 135v150M225 210h150' stroke='%23f59e0b' stroke-opacity='0.4' stroke-width='2'/%3e%3cpath d='M300 160l35 20v40c0 25-35 45-35 45s-35-20-35-45v-40l35-20z' fill='%231a0e33' stroke='%23f59e0b' stroke-width='2'/%3e%3ctext x='300' y='330' fill='%23f59e0b' font-family='sans-serif' font-size='15' font-weight='900' text-anchor='middle' letter-spacing='3'%3eBÚFALOS TACTICAL%3c/text%3e%3ctext x='300' y='352' fill='%2394a3b8' font-family='sans-serif' font-size='11' font-weight='600' text-anchor='middle' letter-spacing='1.5'%3EEQUIPAMIENTO OPERATIVO%3c/text%3e%3c/svg%3e";

export const TACTICAL_PRESET_IMAGES = [
  {
    titulo: 'Casco Balístico',
    url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Chaleco Táctico',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Botas Militares',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Mochila Operativa',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Guantes de Protección',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Visor / Óptica Táctica',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  }
];

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  badge?: React.ReactNode;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-44 bg-night-900 overflow-hidden',
  badge
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const displaySrc = (!hasError && src && src.trim()) ? src.trim() : TACTICAL_DEFAULT_PLACEHOLDER;
  const isUsingFallback = !src || !src.trim() || hasError;

  return (
    <div className={`relative ${containerClassName} group/img`}>
      {/* Shimmer de carga mientras se descarga la imagen */}
      {isLoading && !isUsingFallback && (
        <div className="absolute inset-0 bg-night-850 animate-pulse flex items-center justify-center">
          <Crosshair className="w-6 h-6 text-amber-500/30 animate-spin" />
        </div>
      )}

      {/* Imagen principal con fallback automático en onError */}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={`${className} transition-transform duration-300 group-hover:scale-105 ${
          isLoading && !isUsingFallback ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Marca de agua táctica cuando usa placeholder */}
      {isUsingFallback && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-night-950/80 px-2 py-0.5 rounded-md border border-night-border text-[9px] font-mono text-amber-400/80">
          <Shield className="w-2.5 h-2.5 text-amber-400" />
          <span>Búfalos Tact</span>
        </div>
      )}

      {/* Badge opcional posicionado sobre la imagen */}
      {badge && <div className="absolute top-2 left-2 z-10">{badge}</div>}
    </div>
  );
};
