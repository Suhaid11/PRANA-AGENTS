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
  // Wave calculation
  const minVal = Math.min(...sparkline);
  const maxVal = Math.max(...sparkline);
  const range = maxVal - minVal || 1;
  const width = 120;
  const height = 32;

  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const isCritical = status === 'CRITICAL';
  const isWarning = status === 'WARNING';
  const isHeart = label.toLowerCase().includes('heart');
  const isSpo2 = label.toLowerCase().includes('spo2');

  const strokeColor = isCritical ? '#DC2626' : isWarning ? '#D97706' : '#0E62FE';

  return (
    <div className={`p-4 rounded-2xl bg-white/90 backdrop-blur-md border transition-all ${
      isCritical 
        ? 'border-rose-300 bg-rose-50/20 shadow-xs' 
        : isWarning 
        ? 'border-amber-200 bg-amber-50/20' 
        : 'border-slate-200/70 shadow-xs'
    }`}>
      {/* Top Metadata Row: Small Label + Trend Pill */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
          {isHeart ? <Heart className="w-3 h-3 text-rose-500 fill-current" /> : isSpo2 ? <Wind className="w-3 h-3 text-blue-500" /> : <Gauge className="w-3 h-3 text-slate-600" />}
          <span>{label}</span>
        </div>

        <div className="flex items-center gap-1">
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
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl sm:text-4xl font-extrabold font-tabular tracking-tight leading-none ${
            isCritical ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {value}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {unit}
          </span>
        </div>

        {/* Crisp Dynamic ECG Waveform */}
        <div className="w-[110px] h-[30px] flex items-center justify-end">
          <svg width={width} height={height} className="overflow-visible">
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
