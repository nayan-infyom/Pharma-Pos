/**
 * Format numerical amounts in Indian Rupee (₹) format
 */
export const formatINR = (amount: number, showDecimals: boolean = true): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(amount);
};

export const formatCompactINR = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return formatINR(amount, false);
};

export const formatCurrency = formatINR;

export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateString);
  }
};

export const formatTime = (dateString: string | Date | undefined): string => {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
};

export const formatDateTime = (dateString: string | Date | undefined): string => {
  if (!dateString) return '—';
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  if (!expiryDate) return 999;
  const expiry = new Date(expiryDate).getTime();
  const today = new Date().getTime();
  return Math.ceil((expiry - today) / (1000 * 3600 * 24));
};

export const getExpiryStatus = (expiryDate: string): {
  label: string;
  badgeVariant: 'danger' | 'warning' | 'info' | 'success';
  days: number;
} => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 0) {
    return { label: 'Expired', badgeVariant: 'danger', days };
  }
  if (days <= 7) {
    return { label: `Expires in ${days}d`, badgeVariant: 'danger', days };
  }
  if (days <= 30) {
    return { label: `Expires in ${days}d`, badgeVariant: 'warning', days };
  }
  if (days <= 90) {
    return { label: `Expires in ${Math.round(days / 30)}mo`, badgeVariant: 'info', days };
  }
  return { label: 'Healthy', badgeVariant: 'success', days };
};
