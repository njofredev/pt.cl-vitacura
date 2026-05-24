/**
 * Utility functions for formatting, RUT validation, and other helper tasks
 */

/**
 * Clean a Chilean RUT (removes dots and dashes, converts DV to uppercase)
 */
export function cleanRUT(rut: string): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Formats a Chilean RUT to XX.XXX.XXX-X
 */
export function formatRUT(rut: string): string {
  const cleaned = cleanRUT(rut);
  if (cleaned.length < 2) return cleaned;
  
  const dv = cleaned.slice(-1);
  const numbers = cleaned.slice(0, -1);
  
  let formatted = '';
  for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formatted = '.' + formatted;
    }
    formatted = numbers.charAt(i) + formatted;
  }
  
  return `${formatted}-${dv}`;
}

/**
 * Validates a Chilean RUT checksum (Modulo 11)
 */
export function validateRUT(rut: string): boolean {
  const cleaned = cleanRUT(rut);
  if (cleaned.length < 8) return false;
  
  const dv = cleaned.slice(-1);
  const numbers = parseInt(cleaned.slice(0, -1), 10);
  
  if (isNaN(numbers)) return false;
  
  // Modulo 11 check digit calculation
  let sum = 0;
  let multiplier = 2;
  let currentNum = numbers;
  
  while (currentNum > 0) {
    const digit = currentNum % 10;
    sum += digit * multiplier;
    currentNum = Math.floor(currentNum / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = 11 - remainder;
  
  let expectedDV = '0';
  if (calculatedDV === 11) {
    expectedDV = '0';
  } else if (calculatedDV === 10) {
    expectedDV = 'K';
  } else {
    expectedDV = calculatedDV.toString();
  }
  
  return dv === expectedDV;
}

/**
 * Formats a date string or Date object to DD/MM/YYYY
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  // Use UTC to prevent timezone shift issues on pure dates
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to ISO string (YYYY-MM-DD) for input fields
 */
export function formatToInputDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string or Date object to DD/MM/YYYY HH:MM in local timezone
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} a las ${hours}:${minutes}`;
}
