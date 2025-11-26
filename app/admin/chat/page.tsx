'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import GlassCard from '@/components/GlassCard';
import NeonButton from '@/components/NeonButton';
import { chatAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  conversation_id: number;
  sender_type: 'user' | 'admin';
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  status: string;
  unread_count: number;
  created_at: string;
  last_message_at: string;
}

interface ConversationDetails extends Conversation {
  messages: Message[];
}

export default function AdminChatPage() {
  const router = useRouter();
  const { admin, isAuthenticated, isAdmin, logoutAdmin, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initAuth();
    if (!isAuthenticated || !isAdmin || !admin) {
      router.push('/admin/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated, isAdmin, admin, router, initAuth]);

  useEffect(() => {
    if (selectedConversation) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const response = await chatAPI.getAllConversations(status);
      setConversations(response.data.data.conversations);
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (id: string) => {
    try {
      const response = await chatAPI.getConversationById(id);
      const data = response.data.data;
      setSelectedConversation({
        ...data.conversation,
        messages: data.messages
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
      toast.error('Erreur lors du chargement de la conversation');
    }
  };

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(() => {
      if (selectedConversation) {
        fetchConversationDetails(selectedConversation.id.toString());
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    await fetchConversationDetails(conv.id.toString());
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await chatAPI.sendAdminMessage(selectedConversation.id.toString(), newMessage.trim());
      setNewMessage('');
      fetchConversationDetails(selectedConversation.id.toString());
      fetchConversations(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      setActionLoading(true);
      await chatAPI.closeConversation(selectedConversation.id.toString());
      toast.success('Conversation fermée');
      setSelectedConversation(null);
      fetchConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la fermeture');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenConversation = async () => {
    if (!selectedConversation) return;

    try {
      setActionLoading(true);
      await chatAPI.reopenConversation(selectedConversation.id.toString());
      toast.success('Conversation rouverte');
      fetchConversationDetails(selectedConversation.id.toString());
      fetchConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réouverture');
    } finally {
      setActionLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  if (!isAuthenticated || !isAdmin || !admin) {
    return null;
  }

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Service Client - Chat"
        userName={admin.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen pt-4 sm:pt-6 p-3 sm:p-6 relative">
        <div className="cyber-grid" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Service Client
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Gérer les conversations avec les utilisateurs
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { value: 'all', label: 'Toutes' },
                { value: 'open', label: 'Ouvertes' },
                { value: 'closed', label: 'Fermées' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    activeFilter === filter.value
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <GlassCard className="p-4 h-[600px] overflow-y-auto" glow glowColor="blue">
                <h2 className="text-lg font-semibold text-white mb-4">Conversations</h2>

                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">Aucune conversation</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedConversation?.id === conv.id
                            ? 'bg-red-500/20 border-2 border-red-500/50'
                            : 'bg-gray-800/50 hover:bg-gray-800 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {conv.user_name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{conv.user_email}</p>
                            </div>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              conv.status === 'open'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {conv.status === 'open' ? 'Ouverte' : 'Fermée'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(conv.last_message_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <GlassCard className="p-0 h-[600px] flex flex-col" glow glowColor="red">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-2">
                          {selectedConversation.user_name}
                        </h2>
                        <div className="space-y-1 text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            <span>{selectedConversation.user_email}</span>
                          </div>
                          {selectedConversation.user_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              <span>{selectedConversation.user_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              Créée le{' '}
                              {new Date(selectedConversation.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedConversation.status === 'open' ? (
                          <NeonButton
                            variant="secondary"
                            onClick={handleCloseConversation}
                            disabled={actionLoading}
                            className="text-xs"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Fermer
                          </NeonButton>
                        ) : (
                          <NeonButton
                            variant="primary"
                            onClick={handleReopenConversation}
                            disabled={actionLoading}
                            className="text-xs"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Réouvrir
                          </NeonButton>
                        )}
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/30">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                        <p className="text-gray-400 text-sm">Aucun message</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              msg.sender_type === 'admin'
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-none'
                                : 'bg-gray-800 text-gray-100 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm break-words">{msg.message}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.sender_type === 'admin' ? 'text-red-100/70' : 'text-gray-500'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  {selectedConversation.status === 'open' && (
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrivez votre message..."
                          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                          disabled={sending}
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </GlassCard>
              ) : (
                <GlassCard className="p-8 h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      Sélectionnez une conversation pour commencer
                    </p>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
