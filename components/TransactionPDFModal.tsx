'use client';

import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import TransactionReceipt from './TransactionReceipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface TransactionPDFModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionPDFModal({ transaction, onClose }: TransactionPDFModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Capture l'élément HTML en canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`recu-${transaction.transaction_id}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reçu de transaction</h2>
              <p className="text-sm text-gray-600 mt-1">Transaction: {transaction.transaction_id}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Télécharger PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Imprimer"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Contenu du reçu */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <TransactionReceipt ref={receiptRef} transaction={transaction} />
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          body > div:last-child,
          body > div:last-child * {
            visibility: visible;
          }
          body > div:last-child {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Masquer les boutons lors de l'impression */
          button {
            display: none !important;
          }
          /* Optimiser pour l'impression */
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </>
  );
}
