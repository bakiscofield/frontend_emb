'use client';

import { LogOut, User, Users, UserCog, Mail, MessageCircle, FileCheck } from 'lucide-react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import VerifiedBadge from './VerifiedBadge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  onLogout?: () => void;
  onProfileClick?: () => void;
  showLogout?: boolean;
  showAdminNav?: boolean;
  children?: React.ReactNode;
  isVerified?: boolean;
}

export default function Header({ title, subtitle, userName, onLogout, onProfileClick, showLogout = true, showAdminNav = false, children, isVerified = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md shadow-lg border-b-2 border-emile-red/30" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFF8F8 50%, #F5F5F5 100%)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          {/* Logo EMILE TRANSFER+ - Simple et clair comme sur la page d'accueil */}
          <div className="flex items-center gap-4 flex-1">
            <Image
              src="/logo.png"
              alt="EMILE TRANSFER+"
              width={200}
              height={75}
              className="h-12 sm:h-14 md:h-16 w-auto"
              priority
            />

            {/* Subtitle à côté du logo */}
            {subtitle && (
              <div className="hidden md:block">
                <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
              </div>
            )}
          </div>

          {/* User info et logout - Desktop */}
          {showLogout && (
            <div className="hidden lg:flex items-center gap-4">
              {children}
              {userName && (
                <button
                  onClick={onProfileClick}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-red-300 transition-all cursor-pointer"
                  title="Voir mon profil"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emile-red/10 to-emile-red/5 border border-emile-red/20">
                    <User className="w-4 h-4 text-emile-red" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="text-gray-500 text-xs">Bienvenue</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900">{userName}</p>
                      {isVerified && <VerifiedBadge size="sm" />}
                    </div>
                  </div>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 bg-emile-red/5 border border-emile-red/30 hover:border-emile-red hover:bg-emile-red/10 text-emile-red hover:text-emile-red font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          )}

          {/* User info et logout - Mobile & Tablet */}
          {showLogout && (
            <div className="flex lg:hidden items-center gap-2">
              {children}
              {userName && (
                <button
                  onClick={onProfileClick}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Voir mon profil"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emile-red/10 to-emile-red/5 border border-emile-red/20">
                    <User className="w-4 h-4 text-emile-red" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 max-w-[80px] truncate">{userName}</span>
                    {isVerified && <VerifiedBadge size="sm" />}
                  </div>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 bg-emile-red/10 border border-emile-red/30 hover:border-emile-red hover:bg-emile-red/20 text-emile-red font-medium"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Subtitle mobile - affiché sous le logo */}
        {subtitle && (
          <div className="mt-2 md:hidden">
            <p className="text-xs text-gray-600 font-medium">{subtitle}</p>
          </div>
        )}
      </div>

      {/* Navigation rapide admin */}
      {showAdminNav && (
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                  pathname === '/admin/dashboard'
                    ? 'bg-emile-red text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}
                title="Dashboard"
              >
                <Users className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                  pathname === '/admin/users'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
                title="Utilisateurs"
              >
                <Users className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Utilisateurs</span>
              </button>
              <button
                onClick={() => router.push('/admin/admins')}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                  pathname === '/admin/admins'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                title="Administrateurs"
              >
                <UserCog className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Administrateurs</span>
              </button>
              <button
                onClick={() => router.push('/admin/newsletters')}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                  pathname === '/admin/newsletters'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                }`}
                title="Newsletters"
              >
                <Mail className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Newsletters</span>
              </button>
              <button
                onClick={() => router.push('/admin/chat')}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                  pathname === '/admin/chat'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                }`}
                title="Chat"
              >
                <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Chat</span>
              </button>
              <button
                onClick={() => router.push('/admin/kyc')}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                  pathname === '/admin/kyc'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                }`}
                title="KYC"
              >
                <FileCheck className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">KYC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Divider rouge en bas du header */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-emile-red to-transparent"></div>
    </header>
  );
}
