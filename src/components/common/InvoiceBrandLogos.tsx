import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem, InvoiceBrandLogo } from '../../types';

interface InvoiceBrandLogosProps {
  items?: InvoiceItem[];
  brandLogos?: InvoiceBrandLogo[];
  className?: string;
  showLabel?: boolean;
}

export const InvoiceBrandLogos: React.FC<InvoiceBrandLogosProps> = ({
  items = [],
  brandLogos,
  className = '',
  showLabel = true,
}) => {
  const { brands } = useApp();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // 1. Determine unique brand list to display
  // For historical invoices that already have a stored snapshot, respect that
  const uniqueBrands = React.useMemo(() => {
    if (brandLogos && brandLogos.length > 0) {
      // Deduplicate by brand name
      const map = new Map<string, string>();
      brandLogos.forEach((bl) => {
        if (bl.brand && !map.has(bl.brand)) {
          map.set(bl.brand, bl.logoUrl);
        }
      });
      return Array.from(map.entries()).map(([brand, logoUrl]) => ({
        brand,
        logoUrl,
      }));
    }

    // Derive from items
    const distinctNames = Array.from(
      new Set(items.map((i) => i.brand).filter((b): b is string => Boolean(b && b.trim())))
    );

    return distinctNames.map((brandName) => {
      // Find matching configured brand
      const configured = brands.find(
        (b) => b.name.trim().toLowerCase() === brandName.trim().toLowerCase()
      );

      return {
        brand: brandName,
        logoUrl: configured?.logoUrl || '',
      };
    });
  }, [items, brandLogos, brands]);

  if (uniqueBrands.length === 0) {
    return null;
  }

  const handleImageError = (brandName: string) => {
    setImageErrors((prev) => ({ ...prev, [brandName]: true }));
  };

  return (
    <div className={`invoice-brand-logos-container ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-semibold print:text-slate-700">
            Authorized Brand Distribution Partner:
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 print:gap-4">
        {uniqueBrands.map(({ brand, logoUrl }) => {
          const hasError = imageErrors[brand];
          const hasValidLogo = Boolean(logoUrl && !hasError);

          if (hasValidLogo) {
            return (
              <div
                key={brand}
                className="bg-white/80 p-1 rounded border border-slate-200/60 print:border-none print:p-0 flex items-center justify-center"
                title={`Authorized Distributor for ${brand}`}
              >
                <img
                  src={logoUrl}
                  alt={`${brand} logo`}
                  className="h-9 sm:h-10 w-auto max-w-[130px] object-contain shrink-0"
                  style={{ objectFit: 'contain' }}
                  onError={() => handleImageError(brand)}
                />
              </div>
            );
          }

          // Fallback clean text badge if brand has no logo asset or failed to load
          return (
            <div
              key={brand}
              className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded font-sans tracking-tight uppercase shadow-2xs print:bg-white print:border-slate-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 print:hidden" />
              <span>{brand}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
