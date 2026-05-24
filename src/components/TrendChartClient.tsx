'use client';

import React, { useState } from 'react';

interface TrendChartClientProps {
  caseDates: string[]; // ISO string timestamps from DB
  isDemoData: boolean;
}

export default function TrendChartClient({ caseDates, isDemoData }: TrendChartClientProps) {
  const [activeFilter, setActiveFilter] = useState<'Día' | 'Semana' | 'Mes' | '3 Meses' | 'Todo'>('Todo');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Helper to parse dates safely
  const parsedDates = caseDates.map(d => new Date(d));

  // Dynamic calculations based on activeFilter
  let trendData: { label: string; count: number }[] = [];

  const now = new Date();

  if (activeFilter === 'Día') {
    // Last 24 hours divided into 2-hour blocks
    const slots = [
      { start: 8, end: 10, label: '08:00 - 10:00' },
      { start: 10, end: 12, label: '10:00 - 12:00' },
      { start: 12, end: 14, label: '12:00 - 14:00' },
      { start: 14, end: 16, label: '14:00 - 16:00' },
      { start: 16, end: 18, label: '16:00 - 18:00' },
      { start: 18, end: 20, label: '18:00 - 20:00' },
      { start: 20, end: 22, label: '20:00 - 22:00' }
    ];

    // Calculate real counts for today / last 24h
    trendData = slots.map((slot) => {
      const count = parsedDates.filter(d => {
        const hours = d.getHours();
        const isToday = d.toDateString() === now.toDateString();
        return isToday && hours >= slot.start && hours < slot.end;
      }).length;
      return {
        label: slot.label.split(' - ')[0],
        count
      };
    });
  } 
  else if (activeFilter === 'Semana') {
    // Last 7 days
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
      
      const count = parsedDates.filter(pd => pd.toDateString() === d.toDateString()).length;
      
      trendData.push({
        label: `${dayName} ${dateStr}`,
        count
      });
    }
  } 
  else if (activeFilter === 'Mes') {
    // Last 30 days grouped in 6 intervals of 5 days
    const intervalsCount = 6;
    const daysPerInterval = 5;

    for (let i = intervalsCount - 1; i >= 0; i--) {
      const startDay = new Date();
      startDay.setDate(now.getDate() - (i + 1) * daysPerInterval + 1);
      const endDay = new Date();
      endDay.setDate(now.getDate() - i * daysPerInterval);

      const label = `${startDay.getDate()} al ${endDay.getDate()} ${endDay.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}`;
      
      // Normalize time for comparison
      const startMs = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), 0, 0, 0).getTime();
      const endMs = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 59, 59).getTime();
      const count = parsedDates.filter(pd => {
        const time = pd.getTime();
        return time >= startMs && time <= endMs;
      }).length;

      trendData.push({
        label,
        count
      });
    }
  } 
  else if (activeFilter === '3 Meses') {
    // Last 90 days grouped in 6 intervals of 15 days
    const intervalsCount = 6;
    const daysPerInterval = 15;

    for (let i = intervalsCount - 1; i >= 0; i--) {
      const startDay = new Date();
      startDay.setDate(now.getDate() - (i + 1) * daysPerInterval + 1);
      const endDay = new Date();
      endDay.setDate(now.getDate() - i * daysPerInterval);

      const label = `${startDay.getDate()} ${startDay.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')} - ${endDay.getDate()} ${endDay.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}`;
      
      const startMs = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), 0, 0, 0).getTime();
      const endMs = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 59, 59).getTime();
      const count = parsedDates.filter(pd => {
        const time = pd.getTime();
        return time >= startMs && time <= endMs;
      }).length;

      trendData.push({
        label,
        count
      });
    }
  } 
  else {
    // activeFilter === 'Todo'
    // Group all data by calendar month. Let's show the last 6 calendar months
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const monthName = months[d.getMonth()];
      const yearStr = d.getFullYear().toString().slice(-2);
      const label = `${monthName} ${yearStr}`;

      const count = parsedDates.filter(pd => pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()).length;

      trendData.push({
        label,
        count
      });
    }
  }

  // Generate SVG points based on computed trendData
  const counts = trendData.map(d => d.count);
  const maxCount = Math.max(...counts, 5);
  const totalSlots = trendData.length;
  
  const chartPoints = trendData.map((d, i) => {
    // scale points nicely inside the 600x240 viewbox
    // x range: 50 to 550.
    const x = 50 + i * (500 / (totalSlots - 1 || 1));
    const y = 200 - (d.count / maxCount) * 150; // Keep space on top for tooltips
    return { x, y, label: d.label, count: d.count };
  });

  const linePath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 200 L ${chartPoints[0].x} 200 Z`
    : '';

  const filterOptions: ('Día' | 'Semana' | 'Mes' | '3 Meses' | 'Todo')[] = ['Día', 'Semana', 'Mes', '3 Meses', 'Todo'];

  return (
    <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground-hsl))' }}>
            Tendencia Temporal de Ingresos
          </h3>
          <span style={{ fontSize: '0.78rem', opacity: 0.5, fontWeight: 500 }}>
            {activeFilter === 'Día' && 'Análisis horario de las derivaciones del día de hoy'}
            {activeFilter === 'Semana' && 'Análisis del volumen diario de derivaciones sociales y médicas (Última semana)'}
            {activeFilter === 'Mes' && 'Seguimiento consolidado de derivaciones en bloques de 5 días (Último mes)'}
            {activeFilter === '3 Meses' && 'Análisis de mediano plazo agrupado cada 15 días (Último trimestre)'}
            {activeFilter === 'Todo' && 'Historial completo consolidado mes a mes en la red asistencial'}
          </span>
        </div>
        
        {/* Time range toggle selectors */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          backgroundColor: 'rgba(255,255,255,0.02)', 
          padding: '4px', 
          borderRadius: '9999px', 
          border: '1px solid var(--glass-border)' 
        }}>
          {filterOptions.map((opt) => (
            <button
              key={opt}
              className={`chart-toggle-btn ${activeFilter === opt ? 'active' : ''}`}
              onClick={() => setActiveFilter(opt)}
              style={{
                border: 'none',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: activeFilter === opt ? '#10b981' : 'transparent',
                color: activeFilter === opt ? '#022c22' : 'hsl(var(--foreground-hsl))',
                opacity: activeFilter === opt ? 1 : 0.7,
                boxShadow: activeFilter === opt ? '0 2px 10px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Glowing Line Chart */}
      <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
        <svg viewBox="0 0 600 240" width="100%" height="240" style={{ display: 'block', minWidth: '550px' }}>
          <defs>
            {/* Glowing Linear Gradient for Line Fill */}
            <linearGradient id="neonGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            {/* Glow filter for the path */}
            <filter id="neonGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1="50" y1="40" x2="550" y2="40" stroke="var(--glass-border)" strokeDasharray="4 4" />
          <line x1="50" y1="80" x2="550" y2="80" stroke="var(--glass-border)" strokeDasharray="4 4" />
          <line x1="50" y1="120" x2="550" y2="120" stroke="var(--glass-border)" strokeDasharray="4 4" />
          <line x1="50" y1="160" x2="550" y2="160" stroke="var(--glass-border)" strokeDasharray="4 4" />
          <line x1="50" y1="200" x2="550" y2="200" stroke="var(--glass-border)" />

          {/* Y-axis Ticks */}
          <text x="25" y="44" textAnchor="end" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.4" fontWeight="700" fontFamily="var(--font-sans)">{maxCount}</text>
          <text x="25" y="124" textAnchor="end" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.4" fontWeight="700" fontFamily="var(--font-sans)">{Math.round(maxCount / 2)}</text>
          <text x="25" y="204" textAnchor="end" fontSize="9" fill="hsl(var(--foreground-hsl))" opacity="0.4" fontWeight="700" fontFamily="var(--font-sans)">0</text>

          {/* Area under the line */}
          {areaPath && <path d={areaPath} fill="url(#neonGlowGrad)" style={{ transition: 'd 0.3s ease' }} />}

          {/* Neon Green main Line */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="3" 
              filter="url(#neonGlowFilter)" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ transition: 'd 0.3s ease' }}
            />
          )}

          {/* Vertex Nodes (Dots) */}
          {chartPoints.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g 
                key={i} 
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? 8 : 6} 
                  fill="#10b981" 
                  stroke="hsl(var(--background-hsl))" 
                  strokeWidth="2.5" 
                  style={{ transition: 'all 0.15s ease' }}
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? 3 : 2} 
                  fill="#fff" 
                  style={{ transition: 'all 0.15s ease' }}
                />
                
                {/* Dynamic Value Tooltip bubble */}
                <g style={{ 
                  opacity: isHovered ? 1 : 0.8,
                  transform: isHovered ? 'scale(1.05) translate(0px, -2px)' : 'none',
                  transformOrigin: `${p.x}px ${p.y}px`,
                  transition: 'all 0.15s ease'
                }}>
                  <rect 
                    x={p.x - 16} 
                    y={p.y - 25} 
                    width="32" 
                    height="16" 
                    rx="4" 
                    fill="#022c22" 
                    stroke={isHovered ? '#fff' : '#10b981'} 
                    strokeWidth="1" 
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 14} 
                    textAnchor="middle" 
                    fontSize="9" 
                    fontWeight="800" 
                    fill={isHovered ? '#fff' : '#10b981'} 
                    fontFamily="var(--font-sans)"
                    style={{ transition: 'all 0.15s ease' }}
                  >
                    {p.count}
                  </text>
                </g>

                {/* X-axis Label */}
                <text 
                  x={p.x} 
                  y="222" 
                  textAnchor="middle" 
                  fontSize="9" 
                  fill="hsl(var(--foreground-hsl))" 
                  opacity={isHovered ? 1 : 0.5} 
                  fontWeight={isHovered ? '800' : '700'} 
                  fontFamily="var(--font-sans)"
                  style={{ transition: 'all 0.15s ease' }}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
