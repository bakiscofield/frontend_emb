'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Loader2, Paperclip, FileText, Download } from 'lucide-react';
import { chatAPI } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  conversation_id: number;
  sender_type: 'user' | 'admin';
  sender_id: number;
  message: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  last_message_at: string;
}

export default function ChatWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && !conversation) {
      fetchConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && conversation) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isOpen, conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup file preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversation();
      const data = response.data.data;
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
      toast.error('Erreur lors du chargement du chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;

    try {
      const response = await chatAPI.getMessages(conversation.id.toString());
      const newMessages = response.data.data;

      // Update unread count when chat is closed
      if (!isOpen) {
        const unread = newMessages.filter(
          (msg: Message) => msg.sender_type === 'admin' && !msg.is_read
        ).length;
        setUnreadCount(unread);
      }

      setMessages(newMessages);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  };

  const startPolling = () => {
    // Poll every 5 seconds for new messages
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && !selectedFile) || !conversation) return;

    try {
      setSending(true);
      await chatAPI.sendMessage(conversation.id.toString(), newMessage.trim(), selectedFile || undefined);
      setNewMessage('');
      removeSelectedFile();
      fetchMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const isImageFile = (fileType?: string | null) => {
    return fileType?.startsWith('image/');
  };

  const getFileUrl = (fileUrl: string) => {
    const apiUrl = getApiUrl();
    return `${apiUrl}${fileUrl}`;
  };

  const renderFileAttachment = (msg: Message) => {
    if (!msg.file_url) return null;

    const fullUrl = getFileUrl(msg.file_url);
    const isUser = msg.sender_type === 'user';

    if (isImageFile(msg.file_type)) {
      return (
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={fullUrl}
            alt={msg.file_name || 'Image'}
            className="max-w-full max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }

    return (
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 mt-1 p-2 rounded-lg transition-colors ${
          isUser ? 'bg-red-700/30 hover:bg-red-700/50' : 'bg-gray-700/50 hover:bg-gray-700/70'
        }`}
      >
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs truncate flex-1">{msg.file_name || 'Fichier'}</span>
        <Download className="w-3 h-3 flex-shrink-0" />
      </a>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-red-500/50 transition-shadow"
          >
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : '600px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: isMinimized ? '60px' : '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
                <h3 className="text-white font-semibold text-sm sm:text-base">
                  Service Client
                </h3>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={minimizeChat}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                  aria-label="Minimiser"
                >
                  <Minimize2 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                      <p className="text-gray-400 text-sm">
                        Bienvenue ! Envoyez un message pour démarrer la conversation.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          msg.sender_type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 ${
                            msg.sender_type === 'user'
                              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-none'
                              : 'bg-gray-800 text-gray-100 rounded-bl-none'
                          }`}
                        >
                          {renderFileAttachment(msg)}
                          {msg.message && (
                            <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                          )}
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.sender_type === 'user'
                                ? 'text-red-100/70'
                                : 'text-gray-500'
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

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-3 sm:px-4 pt-2 bg-gray-900 border-t border-gray-800">
                    <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-300 truncate flex-1">{selectedFile.name}</span>
                      <button
                        onClick={removeSelectedFile}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-gray-900 border-t border-gray-800"
                >
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      disabled={sending || loading}
                    >
                      <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                      disabled={sending || loading}
                    />
                    <button
                      type="submit"
                      disabled={sending || loading || (!newMessage.trim() && !selectedFile)}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
