'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, Calendar, Hash, Phone, Mail, DollarSign, ArrowRight } from 'lucide-react';

interface Transaction {
  id: number;
  transaction_id: string;
  user_name: string;
  user_phone: string;
  user_email?: string;
  tmoney_number?: string;
  flooz_number?: string;
  from_number?: string;
  to_number?: string;
  amount: number;
  percentage: number;
  total_amount: number;
  payment_reference: string;
  status: string;
  bookmaker_name?: string;
  notes?: string;
  created_at: string;
  validated_at?: string;
  exchange_pair_name?: string;
}

interface TransactionReceiptProps {
  transaction: Transaction;
}

const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(
  ({ transaction }, ref) => {
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'validated':
          return { icon: CheckCircle, text: 'VALIDÉE', color: 'text-green-600', bg: 'bg-green-100' };
        case 'rejected':
          return { icon: XCircle, text: 'REJETÉE', color: 'text-red-600', bg: 'bg-red-100' };
        default:
          return { icon: Clock, text: 'EN ATTENTE', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      }
    };

    const statusInfo = getStatusInfo(transaction.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div ref={ref} className="bg-white p-8 max-w-3xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header avec logo */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="EMB Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">EMILE TRANSFER+</div>
              <div className="text-sm text-gray-600">Reçu de transaction</div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${statusInfo.bg} flex items-center gap-2`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            <span className={`font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
          </div>
        </div>

        {/* Informations transaction */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Numéro de transaction</div>
              <div className="text-lg font-mono font-bold text-gray-900">{transaction.transaction_id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de création</div>
              <div className="text-sm text-gray-900">
                {new Date(transaction.created_at).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          </div>

          {transaction.validated_at && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de validation</div>
              <div className="text-sm text-gray-900">
                {new Date(transaction.validated_at).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Informations client */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Informations client</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Nom</div>
                <div className="text-sm font-medium text-gray-900">{transaction.user_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Téléphone</div>
                <div className="text-sm font-medium text-gray-900">{transaction.user_phone}</div>
              </div>
            </div>
            {transaction.user_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-900">{transaction.user_email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Détails de l'échange */}
        <div className="mb-8 p-6 bg-red-50 rounded-lg border-2 border-red-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Détails de l'échange</h3>

          {transaction.exchange_pair_name ? (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Type d'échange</div>
              <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">De</div>
                  <div className="text-sm font-bold text-gray-900">{transaction.from_number}</div>
                </div>
                <ArrowRight className="w-6 h-6 text-red-500" />
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Vers</div>
                  <div className="text-sm font-bold text-gray-900">{transaction.to_number}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">TMoney</div>
                <div className="text-sm font-medium text-gray-900 bg-white p-3 rounded">
                  {transaction.tmoney_number}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Flooz</div>
                <div className="text-sm font-medium text-gray-900 bg-white p-3 rounded">
                  {transaction.flooz_number}
                </div>
              </div>
            </div>
          )}

          {transaction.bookmaker_name && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Bookmaker</div>
              <div className="text-sm font-medium text-gray-900 bg-white p-3 rounded">
                {transaction.bookmaker_name}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-gray-500 mb-1">Référence de paiement</div>
            <div className="text-sm font-mono font-bold text-gray-900 bg-white p-3 rounded">
              {transaction.payment_reference}
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Montant</div>
                <div className="text-xl font-bold">{transaction.amount.toFixed(0)} FCFA</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Commission ({transaction.percentage}%)</div>
                <div className="text-xl font-bold text-green-400">
                  {(transaction.total_amount - transaction.amount).toFixed(0)} FCFA
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Total à payer</div>
                <div className="text-2xl font-bold text-red-400">{transaction.total_amount.toFixed(0)} FCFA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</div>
            <div className="text-sm text-gray-700">{transaction.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Ce document est un reçu officiel de transaction EMILE TRANSFER+
          </p>
          <p className="text-xs text-gray-400">
            © 2025 EMILE TRANSFER+ - Tous droits réservés
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Contact : support@emiletransfer.com | Tel: +228 XX XX XX XX
          </p>
        </div>

        {/* QR Code ou code-barres (optionnel) */}
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-400 mb-2">Transaction ID (code-barres)</div>
          <div className="font-mono text-sm text-gray-900 tracking-wider">
            {transaction.transaction_id}
          </div>
        </div>
      </div>
    );
  }
);

TransactionReceipt.displayName = 'TransactionReceipt';

export default TransactionReceipt;
