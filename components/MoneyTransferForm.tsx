'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import AnimatedInput from './AnimatedInput';
import PointDeVenteSelector from './PointDeVenteSelector';
import toast from 'react-hot-toast';

interface Field {
  id: number;
  field_name: string;
  field_type: string;
  field_label: string;
  placeholder: string;
  is_required: boolean;
  options: string | null;
  field_order?: number;
}

interface MoneyTransferFormProps {
  fields: Field[];
  serviceName: string;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  onPointDeVenteChange?: (data: { pointDeVenteId: number | null; clientLatitude: number | null; clientLongitude: number | null }) => void;
}

export default function MoneyTransferForm({ fields, serviceName, onSubmit, onCancel, loading, onPointDeVenteChange }: MoneyTransferFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({
    transfer_service: serviceName
  });
  const [selectedPdVId, setSelectedPdVId] = useState<number | null>(null);

  // Organisation des champs par étapes
  const stepGroups = {
    1: {
      title: 'Type d\'opération',
      icon: '📝',
      fields: ['operation_type']
    },
    2: {
      title: 'Informations personnelles',
      icon: '👤',
      fields: ['client_name', 'client_phone', 'client_email', 'client_location']
    },
    3: {
      title: 'Détails de l\'opération',
      icon: '💰',
      fields: ['send_amount', 'send_currency', 'destination_country', 'beneficiary_name', 'beneficiary_phone', 'mtcn_reference', 'withdrawal_amount', 'origin_country']
    },
    4: {
      title: 'Mode de paiement',
      icon: '💳',
      fields: ['payment_method']
    },
    5: {
      title: 'Pièce d\'identité',
      icon: '🆔',
      fields: ['id_type', 'id_number']
    },
    6: {
      title: 'Point de vente',
      icon: '📍',
      fields: ['pickup_point']
    },
    7: {
      title: 'Confirmation',
      icon: '✅',
      fields: ['confirm_accuracy', 'confirm_preregistration']
    }
  };

  const totalSteps = Object.keys(stepGroups).length;

  // Récupérer les champs pour l'étape actuelle
  const getCurrentStepFields = () => {
    const stepGroup = stepGroups[currentStep as keyof typeof stepGroups];
    if (!stepGroup) return [];

    return fields
      .filter(field => stepGroup.fields.includes(field.field_name))
      .sort((a, b) => (a.field_order || 0) - (b.field_order || 0));
  };

  // Valider l'étape actuelle
  const validateCurrentStep = () => {
    const currentFields = getCurrentStepFields();
    const operationType = formData.operation_type;

    for (const field of currentFields) {
      // Champs conditionnels basés sur le type d'opération
      const isEnvoiField = ['send_amount', 'send_currency', 'destination_country', 'beneficiary_name', 'beneficiary_phone'].includes(field.field_name);
      const isRetraitField = ['mtcn_reference', 'withdrawal_amount', 'origin_country'].includes(field.field_name);

      // Ignorer les champs conditionnels non applicables
      if (operationType === 'Envoi d\'argent' && isRetraitField) continue;
      if (operationType === 'Retrait d\'argent' && isEnvoiField) continue;

      if (field.is_required && !formData[field.field_name]) {
        toast.error(`Le champ "${field.field_label}" est requis`);
        return false;
      }
    }

    return true;
  };

  // Passer à l'étape suivante
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  // Revenir à l'étape précédente
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    await onSubmit(formData);
  };

  // Rendu d'un champ
  const renderField = (field: Field) => {
    const value = formData[field.field_name] || '';
    const operationType = formData.operation_type;

    // Masquer les champs conditionnels selon le type d'opération
    const isEnvoiField = ['send_amount', 'send_currency', 'destination_country', 'beneficiary_name', 'beneficiary_phone'].includes(field.field_name);
    const isRetraitField = ['mtcn_reference', 'withdrawal_amount', 'origin_country'].includes(field.field_name);

    if (operationType === 'Envoi d\'argent' && isRetraitField) return null;
    if (operationType === 'Retrait d\'argent' && isEnvoiField) return null;

    // Champ select
    if (field.field_type === 'select' && field.options) {
      const options = typeof field.options === 'string'
        ? JSON.parse(field.options)
        : field.options;

      return (
        <div key={field.id}>
          <label className="block text-[10px] sm:text-sm font-medium text-gray-200 mb-1 sm:mb-2">
            {field.field_label}
            {field.is_required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <select
            className="w-full px-2.5 py-1.5 sm:px-4 sm:py-3 bg-gray-900/50 border border-gray-700 sm:border-2 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-all text-xs sm:text-base"
            required={field.is_required}
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                [field.field_name]: e.target.value
              })
            }
          >
            <option value="">Sélectionner...</option>
            {options.map((opt: string, i: number) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Champ checkbox
    if (field.field_type === 'checkbox') {
      return (
        <div key={field.id} className="flex items-start gap-1.5 sm:gap-3 p-2 sm:p-4 bg-gray-900/50 border border-gray-700 sm:border-2 rounded-lg">
          <input
            type="checkbox"
            id={field.field_name}
            className="mt-0.5 sm:mt-1 w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-500 bg-gray-800 border-gray-600 rounded focus:ring-red-500 focus:ring-2 flex-shrink-0"
            required={field.is_required}
            checked={value === true || value === 'true'}
            onChange={(e) =>
              setFormData({
                ...formData,
                [field.field_name]: e.target.checked
              })
            }
          />
          <label htmlFor={field.field_name} className="text-[10px] sm:text-sm text-gray-300 cursor-pointer leading-relaxed">
            {field.field_label}
            {field.is_required && <span className="text-red-400 ml-1">*</span>}
          </label>
        </div>
      );
    }

    // Champ file
    if (field.field_type === 'file') {
      return (
        <div key={field.id}>
          <label className="block text-[10px] sm:text-sm font-medium text-gray-200 mb-1 sm:mb-2">
            {field.field_label}
            {field.is_required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <div className="space-y-1.5 sm:space-y-3">
            {/* Bouton de sélection de fichier */}
            <div className="relative">
              <input
                type="file"
                id={`file-${field.field_name}`}
                className="hidden"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Le fichier ne doit pas dépasser 5 MB');
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result as string;
                      setFormData({
                        ...formData,
                        [field.field_name]: base64
                      });
                      toast.success('Fichier chargé avec succès');
                    };
                    reader.onerror = () => {
                      toast.error('Erreur lors de la lecture du fichier');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label
                htmlFor={`file-${field.field_name}`}
                className="block w-full px-2.5 py-1.5 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg cursor-pointer transition-all text-center font-medium text-xs sm:text-base"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Choisir</span>
                </div>
              </label>
            </div>

            {value && (
              <div className="p-1.5 sm:p-3 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[10px] sm:text-sm text-green-400 truncate">
                    Fichier OK
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      [field.field_name]: ''
                    });
                  }}
                  className="text-red-400 hover:text-red-300 text-[10px] sm:text-sm flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            <p className="text-[8px] sm:text-xs text-gray-400">
              JPG, PNG, PDF (max 5MB)
            </p>
          </div>
        </div>
      );
    }

    // Champ text/tel/email/number par défaut
    return (
      <AnimatedInput
        key={field.id}
        label={field.field_label}
        type={field.field_type}
        placeholder={field.placeholder}
        required={field.is_required}
        value={value}
        onChange={(e) =>
          setFormData({
            ...formData,
            [field.field_name]: e.target.value
          })
        }
      />
    );
  };

  return (
    <div className="card-emile max-w-3xl mx-auto p-2 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-2 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
          <span className="text-xl sm:text-4xl flex-shrink-0">💸</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-xl md:text-2xl font-bold text-red-500 truncate">
              {serviceName}
            </h2>
            <p className="text-[10px] sm:text-sm text-gray-400">
              Étape {currentStep}/{totalSteps}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white text-lg sm:text-2xl p-0.5 sm:p-2 -m-0.5 sm:-m-2 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Indicateur d'étapes */}
      <div className="mb-2 sm:mb-8">
        <div className="flex items-center justify-between mb-1.5 sm:mb-4">
          {Object.entries(stepGroups).map(([step, group], index) => {
            const stepNum = parseInt(step);
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 rounded-full font-bold text-[10px] sm:text-sm transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-2.5 h-2.5 sm:w-5 sm:h-5" /> : <span className="text-[10px] sm:text-base">{group.icon}</span>}
                  </div>
                  <p className={`mt-0.5 sm:mt-2 text-[8px] sm:text-xs text-center hidden md:block ${
                    isCurrent ? 'text-white font-semibold' : 'text-gray-400'
                  }`}>
                    {group.title}
                  </p>
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-[2px] sm:h-1 flex-1 mx-[2px] sm:mx-1 ${
                      stepNum < currentStep ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Titre de l'étape actuelle */}
      <div className="mb-2 sm:mb-6">
        <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-2xl">{stepGroups[currentStep as keyof typeof stepGroups]?.icon}</span>
          <span>{stepGroups[currentStep as keyof typeof stepGroups]?.title}</span>
        </h3>
      </div>

      {/* Formulaire */}
      <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); goToNextStep(); }}>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-2 sm:space-y-4 md:space-y-6"
        >
          {currentStep === 6 ? (
            <PointDeVenteSelector
              selectedId={selectedPdVId}
              onSelect={(data) => {
                setSelectedPdVId(data.pointDeVenteId);
                setFormData({ ...formData, pickup_point: data.pointDeVenteId ? `PdV-${data.pointDeVenteId}` : '' });
                onPointDeVenteChange?.(data);
              }}
            />
          ) : (
            getCurrentStepFields().map(renderField)
          )}
        </motion.div>

        {/* Boutons de navigation */}
        <div className="flex gap-1.5 sm:gap-3 mt-3 sm:mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goToPreviousStep}
              className="flex-1 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Précédent</span>
              <span className="xs:hidden">Retour</span>
            </button>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-base"
            >
              Annuler
            </button>
          )}

          <button
            type={currentStep === totalSteps ? 'submit' : 'button'}
            onClick={currentStep === totalSteps ? undefined : goToNextStep}
            className="flex-[2] btn-emile-primary flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-base"
            disabled={loading}
          >
            {loading ? (
              'Envoi...'
            ) : currentStep === totalSteps ? (
              <>
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Valider le préenregistrement</span>
                <span className="xs:hidden">Valider</span>
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information importante */}
      <div className="mt-2 sm:mt-6 p-2 sm:p-4 bg-orange-900/20 border border-orange-500/30 sm:border-2 rounded-lg sm:rounded-xl">
        <div className="flex items-start gap-1.5 sm:gap-3">
          <div className="p-1 sm:p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
            <svg className="w-3 h-3 sm:w-5 sm:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] sm:text-sm font-bold text-orange-300 mb-0.5 sm:mb-1">Info importante</h4>
            <p className="text-[9px] sm:text-xs text-gray-300 leading-relaxed">
              Présentez-vous au point de vente avec votre pièce d'identité pour finaliser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
