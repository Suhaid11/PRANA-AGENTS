import React from 'react';
import { Heart, Wind, Gauge, TrendingDown, TrendingUp } from 'lucide-react';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  sparkline: number[];
  referenceRange: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  label,
  value,
  unit,
  trend,
  status,
  sparkline,
}) => {
  // Wave calculation with bounded coordinates and safety margins
  const count = sparkline.length;
  const minVal = count > 0 ? Math.min(...sparkline) : 0;
  const maxVal = count > 0 ? Math.max(...sparkline) : 100;
  const range = maxVal - minVal || 1;
  const viewWidth = 100;
  const viewHeight = 32;
  const padY = 4; // Safety padding so stroke never clips
  const plotHeight = viewHeight - padY * 2;

  const points = count > 1
    ? sparkline
        .map((val, idx) => {
          const x = (idx / (count - 1)) * viewWidth;
          const y = viewHeight - padY - ((val - minVal) / range) * plotHeight;
          return `${Number(x.toFixed(1))},${Number(y.toFixed(1))}`;
        })
        .join(' ')
    : `0,${viewHeight / 2} ${viewWidth},${viewHeight / 2}`;

  const isCritical = status === 'CRITICAL';
  const isWarning = status === 'WARNING';
  const isHeart = label.toLowerCase().includes('heart');
  const isSpo2 = label.toLowerCase().includes('spo2');

  const strokeColor = isCritical ? '#DC2626' : isWarning ? '#D97706' : '#0E62FE';
  const isCompoundValue = String(value).length > 4;

  return (
    <div className={`p-4 rounded-2xl bg-white/90 backdrop-blur-md border transition-all min-w-0 ${
      isCritical 
        ? 'border-rose-300 bg-rose-50/20 shadow-xs' 
        : isWarning 
        ? 'border-amber-200 bg-amber-50/20' 
        : 'border-slate-200/70 shadow-xs'
    }`}>
      {/* Top Metadata Row: Small Label + Trend Pill */}
      <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider truncate">
          {isHeart ? <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0" /> : isSpo2 ? <Wind className="w-3 h-3 text-blue-500 shrink-0" /> : <Gauge className="w-3 h-3 text-slate-600 shrink-0" />}
          <span className="truncate">{label}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {trend === 'DOWN' && <TrendingDown className={`w-3 h-3 ${isCritical ? 'text-rose-600' : 'text-blue-600'}`} />}
          {trend === 'UP' && <TrendingUp className={`w-3 h-3 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />}
          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
            isCritical
              ? 'bg-rose-100 text-rose-800'
              : isWarning
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Hero Numerical Value (Dominant Visual Element) + Wave */}
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <div className="flex items-baseline gap-1 shrink-0 min-w-0">
          <span className={`${isCompoundValue ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-extrabold font-tabular tracking-tight leading-none ${
            isCritical ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {value}
          </span>
          <span className="text-xs font-bold text-slate-500 shrink-0">
            {unit}
          </span>
        </div>

        {/* Crisp Dynamic ECG Waveform — Contained Plot Region */}
        <div className="w-20 sm:w-24 h-7 flex items-center justify-end relative overflow-hidden shrink-0">
          <svg 
            viewBox="0 0 100 32" 
            preserveAspectRatio="none"
            className="w-full h-full block"
          >
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth={isCritical ? "2.5" : "2"}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
