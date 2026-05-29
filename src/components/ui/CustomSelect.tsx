'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  hasError?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccione...',
  disabled = false,
  id,
  hasError = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div ref={containerRef} id={id} style={{ position: 'relative', width: '100%', outline: 'none' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          paddingRight: '14px',
          userSelect: 'none',
          minHeight: '44px',
          borderColor: hasError ? 'hsl(var(--danger-hsl))' : undefined,
          boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : undefined,
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ color: selectedOpt ? 'var(--foreground-hsl)' : 'hsla(var(--foreground-hsl) / 0.5)' }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <ChevronDown size={16} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.2s ease',
          opacity: 0.7 
        }} />
      </div>

      {isOpen && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 1000,
            background: 'var(--select-option-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: '10px',
            padding: '4px'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'hsla(var(--primary-hsl) / 0.1)' : 'transparent',
                  color: isSelected ? 'hsl(var(--primary-hsl))' : 'var(--foreground-hsl)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'hsla(var(--foreground-hsl) / 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
