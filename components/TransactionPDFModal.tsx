'use client';

import { useRef, useState } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import TransactionReceipt from './TransactionReceipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    setIsGenerating(true);
    const loadingToast = toast.loading('Génération du PDF en cours...');

    try {
      // Capture l'élément HTML en canvas avec une meilleure qualité
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // Haute qualité
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: receiptRef.current.scrollWidth,
        windowHeight: receiptRef.current.scrollHeight,
      });

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png', 1.0); // Qualité maximale
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Compression pour réduire la taille
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Si le contenu dépasse une page, gérer le multi-pages
      let heightLeft = imgHeight;
      let position = 0;

      // Première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Pages suivantes si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      // Télécharger le PDF
      pdf.save(`recu-${transaction.transaction_id}.pdf`);

      toast.success('PDF téléchargé avec succès!', { id: loadingToast });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF', { id: loadingToast });
    } finally {
      setIsGenerating(false);
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
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                title="Télécharger PDF"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Génération...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </>
                )}
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
