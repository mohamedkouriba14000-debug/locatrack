import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { MessageCircle, Send, Plus, User, Check, CheckCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MessagesPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { language } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  
  useEffect(() => {
    fetchConversations();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);
  
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Poll for new messages every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedConversation]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations`, { headers: getAuthHeaders() });
      setConversations(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API}/messages/conversations/${conversationId}`, { headers: getAuthHeaders() });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };
  
  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get(`${API}/messages/users`, { headers: getAuthHeaders() });
      setAvailableUsers(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleNewConversation = async (participantId) => {
    try {
      const response = await axios.post(`${API}/messages/conversations`, { participant_id: participantId }, { headers: getAuthHeaders() });
      setShowNewDialog(false);
      setSelectedConversation(response.data);
      fetchConversations();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      await axios.post(`${API}/messages/send`, {
        conversation_id: selectedConversation.id,
        content: newMessage
      }, { headers: getAuthHeaders() });
      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const openNewDialog = () => {
    fetchAvailableUsers();
    setShowNewDialog(true);
  };
  
  const getOtherParticipantName = (conv) => {
    const idx = conv.participants.indexOf(user?.id);
    return conv.participant_names[idx === 0 ? 1 : 0] || 'Unknown';
  };
  
  const getUnreadCount = (conv) => {
    return conv.unread_count?.[user?.id] || 0;
  };
  
  const getRoleBadge = (role) => {
    switch(role) {
      case 'superadmin': return '👑';
      case 'admin': return '🔑';
      default: return '👤';
    }
  };
  
  const filteredUsers = availableUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</div></Layout>;
  
  return (
    <Layout>
      <div className="h-[calc(100vh-180px)] flex gap-4">
        {/* Conversations List */}
        <Card className="w-80 flex flex-col bg-white border-2 border-slate-200">
          <CardHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="text-cyan-500" size={24} />
                {language === 'fr' ? 'Messages' : 'الرسائل'}
              </CardTitle>
              <Button onClick={openNewDialog} size="sm" className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white">
                <Plus size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === 'fr' ? 'Aucune conversation' : 'لا توجد محادثات'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const unread = getUnreadCount(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-cyan-100 to-violet-100 border-2 border-cyan-300' 
                          : 'hover:bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                          {getOtherParticipantName(conv).charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800 truncate">{getOtherParticipantName(conv)}</p>
                            {unread > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{conv.last_message || (language === 'fr' ? 'Nouvelle conversation' : 'محادثة جديدة')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col bg-white border-2 border-slate-200">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                    {getOtherParticipantName(selectedConversation).charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{getOtherParticipantName(selectedConversation)}</CardTitle>
                    <p className="text-xs text-slate-500">{language === 'fr' ? 'En ligne' : 'متصل'}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-white">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isMine ? 'order-2' : ''}`}>
                          {!isMine && (
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              {getRoleBadge(msg.sender_role)} {msg.sender_name}
                            </p>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${
                            isMine 
                              ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-br-md' 
                              : 'bg-white border-2 border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                            <p className="text-xs text-slate-400">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isMine && (
                              msg.read ? <CheckCheck size={14} className="text-cyan-500" /> : <Check size={14} className="text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={language === 'fr' ? 'Écrivez un message...' : 'اكتب رسالة...'}
                    className="flex-1 h-12 bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl"
                  />
                  <Button type="submit" className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white rounded-xl">
                    <Send size={20} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">{language === 'fr' ? 'Sélectionnez une conversation' : 'اختر محادثة'}</p>
                <p className="text-slate-400 text-sm mt-1">{language === 'fr' ? 'ou créez-en une nouvelle' : 'أو أنشئ واحدة جديدة'}</p>
              </div>
            </div>
          )}
        </Card>
        
        {/* New Conversation Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-md bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-cyan-600 font-heading text-2xl flex items-center gap-2">
                <MessageCircle size={24} /> {language === 'fr' ? 'Nouvelle conversation' : 'محادثة جديدة'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {language === 'fr' ? 'Choisissez un utilisateur' : 'اختر مستخدم'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher...' : 'بحث...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10 bg-slate-50 border-2 border-slate-200"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleNewConversation(u.id)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 border-2 border-transparent hover:border-cyan-200 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                      {u.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{getRoleBadge(u.role)} {u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center py-4 text-slate-400">{language === 'fr' ? 'Aucun utilisateur trouvé' : 'لم يتم العثور على مستخدمين'}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MessagesPage;
