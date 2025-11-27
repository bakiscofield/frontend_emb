'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CGUDocument {
  version: string;
  lastUpdated: string;
  title: string;
  content: string;
}

export default function CGUPage() {
  const [cguData, setCguData] = useState<CGUDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCGU = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/legal/cgu`);
        const data = await response.json();

        if (data.success) {
          setCguData(data.document);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des CGU:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCGU();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cyber-grid"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-white mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="cyber-grid"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'inscription
          </Link>

          <div className="card-emile">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {cguData?.title || 'Conditions Générales d\'Utilisation'}
                </h1>
                {cguData && (
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Mise à jour: {new Date(cguData.lastUpdated).toLocaleDateString('fr-FR')}
                    </span>
                    <span>Version {cguData.version}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card-emile prose prose-invert max-w-none">
          {cguData ? (
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                hr: ({ node, ...props }) => <hr className="border-gray-700 my-6" {...props} />,
              }}
            >
              {cguData.content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400">Impossible de charger les Conditions Générales d'Utilisation.</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="btn-emile-primary inline-flex items-center gap-2"
          >
            Retour à l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
}
