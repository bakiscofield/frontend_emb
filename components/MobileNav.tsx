'use client';

import { useState } from 'react';
import { Menu, X, Home, History, User, LogOut, Settings } from 'lucide-react';

interface MobileNavProps {
  userName?: string;
  onLogout?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function MobileNav({ userName, onLogout, activeTab, onTabChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Burger Menu Button */}
      <button
        onClick={toggleMenu}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade-in"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Menu</h2>
              <button
                onClick={toggleMenu}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {userName && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Bienvenue</p>
                  <p className="font-semibold">{userName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <button
              onClick={() => handleTabClick('new')}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
                activeTab === 'new'
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Nouvelle transaction</span>
            </button>

            <button
              onClick={() => handleTabClick('history')}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="font-medium">Historique</span>
            </button>

            <div className="border-t border-gray-200 my-4"></div>

            <button
              className="w-full flex items-center gap-4 px-6 py-4 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Paramètres</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                }
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
