'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export default function CustomDatePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'DD/MM/AAAA'
}: CustomDatePickerProps) {
  const [textVal, setTextVal] = useState('');

  // Synchronize when value changes from outside
  useEffect(() => {
    if (!value) {
      setTextVal('');
      return;
    }
    const parts = value.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD -> DD/MM/AAAA
      setTextVal(`${parts[2]}/${parts[1]}/${parts[0]}`);
    } else {
      setTextVal(value);
    }
  }, [value]);

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

    // If fully filled (DD/MM/AAAA), trigger standard ISO YYYY-MM-DD update
    if (raw.length === 8) {
      const day = raw.substring(0, 2);
      const month = raw.substring(2, 4);
      const year = raw.substring(4, 8);
      onChange(`${year}-${month}-${day}`);
    } else if (raw.length === 0) {
      onChange('');
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    onChange(val);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        className="form-input"
        type="text"
        placeholder={placeholder}
        value={textVal}
        onChange={handleTextChange}
        required={required}
        disabled={disabled}
        style={{ paddingRight: '44px', width: '100%' }}
      />
      
      {/* Premium calendar icon display container */}
      <div style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        color: 'hsl(var(--primary-hsl))',
        opacity: disabled ? 0.5 : 0.8
      }}>
        <Calendar size={16} />
      </div>
      
      {/* Invisible native overlay calendar picker for actual date selection popup */}
      <input
        type="date"
        value={value || ''}
        onChange={handleNativeChange}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '32px',
          height: '32px',
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          zIndex: 5
        }}
      />
    </div>
  );
}
