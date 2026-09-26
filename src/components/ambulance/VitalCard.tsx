import React from 'react';
import { Heart, Wind, TrendingDown, TrendingUp, Activity } from 'lucide-react';

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
  referenceRange,
}) => {
  // Wave calculation with bounded coordinates and safety margins to guarantee ZERO clipping
  const count = sparkline.length;
  const minVal = count > 0 ? Math.min(...sparkline) : 0;
  const maxVal = count > 0 ? Math.max(...sparkline) : 100;
  const range = maxVal - minVal || 1;
  const viewWidth = 120;
  const viewHeight = 36;
  const padY = 5; // Generous safety padding so stroke & glow never clip
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

  // Polygon area points for subtle clinical glow under the line
  const areaPoints = `${points} ${viewWidth},${viewHeight} 0,${viewHeight}`;

  const isCritical = status === 'CRITICAL';
  const isWarning = status === 'WARNING';
  const isHeart = label.toLowerCase().includes('heart');
  const isSpo2 = label.toLowerCase().includes('spo2');

  const strokeColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : isSpo2 ? '#06B6D4' : '#0E62FE';
  const fillGradientId = `grad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`p-4 rounded-2xl bg-white border transition-all relative overflow-hidden min-w-0 shadow-xs ${
      isCritical 
        ? 'border-rose-300 bg-gradient-to-br from-white via-rose-50/20 to-rose-50/40 ring-1 ring-rose-200' 
        : isWarning 
        ? 'border-amber-200 bg-gradient-to-br from-white via-amber-50/15 to-amber-50/30' 
        : 'border-slate-200/90 hover:border-blue-300/80 hover:shadow-sm'
    }`}>
      {/* Top Row: Label, Icon, and Semantic Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider truncate">
          {isHeart ? (
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 shrink-0" />
          ) : isSpo2 ? (
            <Wind className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-[#0E62FE] shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {trend === 'DOWN' && <TrendingDown className={`w-3 h-3 ${isCritical ? 'text-rose-600' : 'text-blue-600'}`} />}
          {trend === 'UP' && <TrendingUp className={`w-3 h-3 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isCritical
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : isWarning
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Middle Row: Large Tabular Number + Sparkline Monitor */}
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <div className="flex items-baseline gap-1.5 shrink-0 min-w-0">
          <span className={`text-3xl sm:text-4xl font-black font-tabular tracking-tight leading-none ${
            isCritical ? 'text-rose-600' : isWarning ? 'text-slate-900' : 'text-slate-900'
          }`}>
            {value}
          </span>
          <span className="text-xs font-bold text-slate-500 shrink-0 uppercase tracking-wider">
            {unit}
          </span>
        </div>

        {/* Contained ECG / Metric Sparkline with Zero Clipping */}
        <div className="w-24 sm:w-28 h-8 flex items-center justify-end relative overflow-hidden shrink-0">
          <svg 
            viewBox="0 0 120 36" 
            preserveAspectRatio="none"
            className="w-full h-full block overflow-visible"
          >
            <defs>
              <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Fill under Sparkline */}
            <polygon
              points={areaPoints}
              fill={`url(#${fillGradientId})`}
            />

            {/* The Crisp Signal Wave */}
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

      {/* Bottom Metadata: Physiological Reference Band */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-medium">Ref Range:</span>
        <span className="font-mono font-bold text-slate-600">{referenceRange}</span>
      </div>
    </div>
  );
};
