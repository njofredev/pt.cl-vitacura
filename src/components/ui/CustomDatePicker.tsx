'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  hasError?: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CustomDatePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'DD/MM/AAAA',
  hasError = false
}: CustomDatePickerProps) {
  const [textVal, setTextVal] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar display states
  const [viewDate, setViewDate] = useState(new Date());

  // Years for the selector (1920 to current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 11 }, (_, i) => currentYear + 5 - i);

  // Synchronize when value changes from outside
  useEffect(() => {
    if (!value) {
      setTextVal('');
      setViewDate(new Date());
      return;
    }
    const parts = value.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD -> DD/MM/AAAA
      setTextVal(`${parts[2]}/${parts[1]}/${parts[0]}`);
      setViewDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
    } else {
      setTextVal(value);
    }
  }, [value]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);

    let formatted = '';
    if (raw.length > 0) {
      formatted += raw.substring(0, 2);
      if (raw.length > 2) {
        formatted += '/' + raw.substring(2, 4);
        if (raw.length > 4) {
          formatted += '/' + raw.substring(4, 8);
        }
      }
    }
    setTextVal(formatted);

    // If fully filled (DD/MM/AAAA), trigger update
    if (raw.length === 8) {
      const day = parseInt(raw.substring(0, 2), 10);
      const month = parseInt(raw.substring(2, 4), 10);
      const year = parseInt(raw.substring(4, 8), 10);

      // Simple boundary checks
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= currentYear + 10) {
        const paddedDay = day.toString().padStart(2, '0');
        const paddedMonth = month.toString().padStart(2, '0');
        onChange(`${year}-${paddedMonth}-${paddedDay}`);
      }
    } else if (raw.length === 0) {
      onChange('');
    }
  };

  const handleSelectDay = (day: number) => {
    const year = viewDate.getFullYear();
    const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const isoDate = `${year}-${month}-${dayStr}`;
    onChange(isoDate);
    setShowCalendar(false);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(viewDate.getFullYear(), parseInt(e.target.value, 10), 1);
    setViewDate(newDate);
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(parseInt(e.target.value, 10), viewDate.getMonth(), 1);
    setViewDate(newDate);
  };

  const handleSetToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setShowCalendar(false);
  };

  const handleClear = () => {
    onChange('');
    setShowCalendar(false);
  };

  // Generate calendar days
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Previous month days to fill grid
  const prevMonthDate = new Date(year, month, 0);
  const prevMonthDays = prevMonthDate.getDate();

  const calendarCells = [];
  // Fill previous month days
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  // Fill current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ day: i, isCurrentMonth: true });
  }
  // Fill next month days to complete grid (usually 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ day: i, isCurrentMonth: false });
  }

  // Check if a day is the selected day
  const isSelected = (day: number, isCurrentMonth: boolean) => {
    if (!value || !isCurrentMonth) return false;
    const parts = value.split('-');
    return (
      parseInt(parts[0], 10) === year &&
      parseInt(parts[1], 10) === month + 1 &&
      parseInt(parts[2], 10) === day
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          className={`form-input`}
          type="text"
          placeholder={placeholder}
          value={textVal}
          onChange={handleTextChange}
          required={required}
          disabled={disabled}
          onClick={() => {
            if (!disabled) setShowCalendar(true);
          }}
          style={{
            paddingRight: '44px',
            width: '100%',
            borderColor: hasError ? 'hsl(var(--danger-hsl))' : undefined,
            boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : undefined
          }}
        />
        
        {/* Calendar Icon toggle */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCalendar(!showCalendar)}
          style={{
            position: 'absolute',
            right: '12px',
            background: 'none',
            border: 'none',
            padding: '4px',
            color: 'hsl(var(--primary-hsl))',
            opacity: disabled ? 0.4 : 0.8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            width: 'auto',
            height: 'auto'
          }}
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      {/* Modern Custom Dropdown Calendar */}
      {showCalendar && (
        <div 
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1000,
            width: '320px',
            padding: '16px',
            backgroundColor: 'hsl(var(--card-hsl))',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            userSelect: 'none'
          }}
        >
          {/* Header selectors */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <button 
              type="button" 
              onClick={() => changeMonth(-1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--foreground-hsl))',
                opacity: 0.7,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                justifyContent: 'center'
              }}
              className="btn-secondary"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }}>
              <select
                value={month}
                onChange={handleMonthSelect}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--foreground-hsl))',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx} style={{ backgroundColor: 'var(--select-option-bg)', color: 'var(--select-option-fg)' }}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={handleYearSelect}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--foreground-hsl))',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}
              >
                {years.map(y => (
                  <option key={y} value={y} style={{ backgroundColor: 'var(--select-option-bg)', color: 'var(--select-option-fg)' }}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              onClick={() => changeMonth(1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--foreground-hsl))',
                opacity: 0.7,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                justifyContent: 'center'
              }}
              className="btn-secondary"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '2px' }}>
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
              <span key={d} style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.4 }}>
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {calendarCells.map((cell, idx) => {
              const active = isSelected(cell.day, cell.isCurrentMonth);
              return (
                <button
                  key={`${cell.day}-${idx}`}
                  type="button"
                  disabled={!cell.isCurrentMonth}
                  onClick={() => handleSelectDay(cell.day)}
                  style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: active ? 'hsl(var(--primary-hsl))' : 'transparent',
                    color: active 
                      ? '#ffffff' 
                      : cell.isCurrentMonth 
                        ? 'hsl(var(--foreground-hsl))' 
                        : 'rgba(120, 120, 120, 0.25)',
                    fontSize: '0.82rem',
                    fontWeight: active || cell.isCurrentMonth ? 600 : 400,
                    cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: cell.isCurrentMonth ? 1 : 0.3,
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    if (cell.isCurrentMonth && !active) {
                      e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cell.isCurrentMonth && !active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Action buttons footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '10px',
            marginTop: '4px'
          }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--danger-hsl))',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Borrar
            </button>
            
            <button
              type="button"
              onClick={handleSetToday}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--primary-hsl))',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
