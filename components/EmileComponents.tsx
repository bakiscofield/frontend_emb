'use client';

import { Check, X, Clock, ArrowRight } from 'lucide-react';

/**
 * COMPOSANTS UI EMILE TRANSFER+
 *
 * Collection de composants réutilisables avec le style EMILE TRANSFER+
 * basé sur le logo (rouge néon + vert néon + fond gris sombre)
 */

// ========== BOUTONS ==========

export function EmileButtonPrimary({
  children,
  onClick,
  disabled = false,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-emile-primary ${className}`}
    >
      {children}
    </button>
  );
}

export function EmileButtonSuccess({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-emile-success ${className}`}
    >
      {children}
    </button>
  );
}

export function EmileButtonSecondary({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-emile-secondary ${className}`}
    >
      {children}
    </button>
  );
}

// ========== CARTES ==========

export function EmileCard({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-emile ${className}`}>
      {children}
    </div>
  );
}

export function EmileTransactionCard({
  amount,
  from,
  to,
  status,
  date,
  onClick
}: {
  amount: string;
  from: string;
  to: string;
  status: 'pending' | 'validated' | 'rejected';
  date: string;
  onClick?: () => void;
}) {
  const statusConfig = {
    pending: {
      badge: 'badge-emile-pending',
      icon: <Clock className="w-4 h-4" />,
      label: 'En attente'
    },
    validated: {
      badge: 'badge-emile-success',
      icon: <Check className="w-4 h-4" />,
      label: 'Validé'
    },
    rejected: {
      badge: 'badge-emile-active',
      icon: <X className="w-4 h-4" />,
      label: 'Rejeté'
    }
  };

  const config = statusConfig[status];

  return (
    <div
      className="card-emile cursor-pointer"
      onClick={onClick}
    >
      {/* Header avec montant et statut */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-2xl font-bold text-emile-red">{amount}</p>
          <p className="text-sm text-emile-text-secondary mt-1">{date}</p>
        </div>
        <span className={config.badge}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </span>
      </div>

      {/* Échange */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-white font-medium">{from}</span>
        <ArrowRight className="w-4 h-4 text-emile-red" />
        <span className="text-white font-medium">{to}</span>
      </div>

      {/* Divider */}
      <div className="divider-emile my-3"></div>

      {/* Footer */}
      <p className="text-xs text-emile-text-secondary text-center">
        Cliquez pour voir les détails
      </p>
    </div>
  );
}

// ========== FORMULAIRES ==========

export function EmileInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="form-label text-white">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="input-emile"
      />
    </div>
  );
}

export function EmileSelect({
  label,
  options,
  value,
  onChange,
  required = false
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="form-label text-white">{label}</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="input-emile"
      >
        <option value="">Sélectionner...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ========== BADGES ==========

export function EmileBadgeActive({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge-emile-active">
      {children}
    </span>
  );
}

export function EmileBadgeSuccess({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge-emile-success">
      {children}
    </span>
  );
}

export function EmileBadgePending({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge-emile-pending">
      {children}
    </span>
  );
}

// ========== CONTENEUR MOBILE APP ==========

export function EmileMobileContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-app-container">
      {children}
    </div>
  );
}

// ========== DIVIDER ==========

export function EmileDivider({ className = '' }: { className?: string }) {
  return <div className={`divider-emile ${className}`}></div>;
}

// ========== STATISTIQUES / INFO CARDS ==========

export function EmileStatCard({
  label,
  value,
  icon,
  trend
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="card-emile">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-emile-text-secondary mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend === 'up' ? 'text-emile-green' : 'text-emile-red'}`}>
              {trend === 'up' ? '↑' : '↓'} Tendance
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-emile-red">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ========== LOADING ==========

export function EmileLoading({ text = 'Chargement' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="w-16 h-16 border-4 border-emile-red border-t-transparent rounded-full animate-spin"></div>
      <p className="text-emile-text-secondary">{text}<span className="loading-dots"></span></p>
    </div>
  );
}

// ========== NOTIFICATION TOAST ==========

export function EmileToast({
  type,
  message,
  onClose
}: {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}) {
  const config = {
    success: {
      bg: 'bg-emile-green-neon/10',
      border: 'border-emile-green-neon',
      text: 'text-emile-green',
      icon: <Check className="w-5 h-5" />
    },
    error: {
      bg: 'bg-emile-red-neon/10',
      border: 'border-emile-red-neon',
      text: 'text-emile-red',
      icon: <X className="w-5 h-5" />
    },
    info: {
      bg: 'bg-white/5',
      border: 'border-white/20',
      text: 'text-white',
      icon: <Clock className="w-5 h-5" />
    }
  };

  const style = config[type];

  return (
    <div className={`${style.bg} ${style.border} ${style.text} border-2 rounded-xl p-4 flex items-center gap-3 animate-slide-in`}>
      {style.icon}
      <p className="flex-1 font-medium">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
