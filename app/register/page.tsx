'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Phone, User, Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [step, setStep] = useState<'form' | 'code'>('form');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await authAPI.requestVerificationCode(registerData);

      setSavedEmail(formData.email);
      setStep('code');
      toast.success('Un code de vérification a été envoyé à votre email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de l\'envoi du code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 3) {
      toast.error('Le code doit contenir 3 chiffres');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyAndRegister({
        email: savedEmail,
        code: verificationCode
      });

      const { token, user } = response.data;
      setUser(user, token);
      toast.success('Compte créé avec succès !');
      router.push('/dashboard');
    } catch (error: any) {
      const data = error.response?.data;

      if (data?.newCodeSent) {
        toast.error(data.message);
        setVerificationCode('');
      } else if (data?.expired) {
        toast.error('Le code a expiré. Cliquez sur "Renvoyer le code"');
      } else {
        toast.error(data?.message || 'Code incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);

    try {
      await authAPI.resendVerificationCode(savedEmail);
      setVerificationCode('');
      toast.success('Un nouveau code a été envoyé');
    } catch (error: any) {
      toast.error('Erreur lors du renvoi du code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Grille de fond animée */}
      <div className="cyber-grid"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo EMILE TRANSFER+ */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="EMILE TRANSFER+"
              width={300}
              height={100}
              className="h-20 w-auto drop-shadow-2xl brightness-0 invert cursor-pointer hover:scale-105 transition-transform"
              style={{ filter: 'brightness(0) invert(1)' }}
              priority
            />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Inscription</h1>
          <p className="text-gray-400">
            {step === 'form' ? 'Créez votre compte sécurisé' : 'Vérification par email'}
          </p>
        </div>

        {/* Formulaire avec style EMILE TRANSFER+ */}
        <div className="card-emile animate-slide-in">
          {step === 'form' ? (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Nom complet
                </label>
                <input
                  type="text"
                  className="input-emile"
                  placeholder="Votre nom complet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  className="input-emile"
                  placeholder="+228 XX XX XX XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input-emile"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Un code de vérification sera envoyé à cet email
                </p>
              </div>

              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="input-emile"
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  className="input-emile"
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-emile-primary w-full mt-6"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Continuer'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <KeyRound className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Code de vérification</h2>
                <p className="text-gray-400 text-sm">
                  Un code à 3 chiffres a été envoyé à<br />
                  <span className="text-white font-medium">{savedEmail}</span>
                </p>
              </div>

              <div>
                <label className="form-label text-white text-center block mb-3">
                  Entrez le code reçu par email
                </label>
                <input
                  type="text"
                  className="input-emile text-center text-2xl tracking-widest font-bold"
                  placeholder="000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setVerificationCode(value);
                  }}
                  maxLength={3}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Vous avez 3 tentatives avant qu'un nouveau code soit envoyé
                </p>
              </div>

              <button
                type="submit"
                className="btn-emile-primary w-full"
                disabled={loading || verificationCode.length !== 3}
              >
                {loading ? 'Vérification...' : 'Vérifier et créer mon compte'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-emile-red hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
