'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
      setStep('code');
      toast.success('Un code de réinitialisation a été envoyé à votre email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email,
        code: verificationCode,
        newPassword
      });

      setStep('success');
      toast.success('Mot de passe réinitialisé avec succès');
    } catch (error: any) {
      const data = error.response?.data;

      if (data?.newCodeSent) {
        toast.error(data.message);
        setVerificationCode('');
      } else if (data?.expired) {
        toast.error('Le code a expiré. Demandez un nouveau code');
        setStep('email');
      } else {
        toast.error(data?.message || 'Code incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewCode = async () => {
    setLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
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
          <h1 className="text-3xl font-bold text-white mb-2">Mot de passe oublié</h1>
          <p className="text-gray-400">
            {step === 'email' && 'Réinitialisez votre mot de passe'}
            {step === 'code' && 'Vérification par email'}
            {step === 'success' && 'Réinitialisation réussie'}
          </p>
        </div>

        {/* Formulaire */}
        <div className="card-emile animate-slide-in">
          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  className="input-emile"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  Un code de vérification sera envoyé à cet email
                </p>
              </div>

              <button
                type="submit"
                className="btn-emile-primary w-full"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <button
                type="button"
                onClick={() => setStep('email')}
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
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <div>
                <label className="form-label text-white text-center block mb-3">
                  Code de vérification
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

              <div>
                <label className="form-label text-white flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  className="input-emile"
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-emile-primary w-full"
                disabled={loading || verificationCode.length !== 3}
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleRequestNewCode}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Réinitialisation réussie !</h2>
              <p className="text-gray-400">
                Votre mot de passe a été réinitialisé avec succès.
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-emile-primary w-full"
              >
                Aller à la connexion
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
