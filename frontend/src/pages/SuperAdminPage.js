import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Search, Building2, Users, Car, FileText, Trash2, Edit, Crown, 
  DollarSign, UserCheck, AlertTriangle, Calendar, Eye, Ban, 
  CheckCircle, Clock, Shield, RefreshCw, MoreVertical, UserX,
  Sparkles, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SuperAdminPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', company_name: '' });
  const [subscriptionType, setSubscriptionType] = useState('annual');
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/all-users`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() })
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({ 
      full_name: user.full_name, 
      email: user.email, 
      phone: user.phone || '',
      company_name: user.company_name || ''
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/users/${selectedUser.id}`, formData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Utilisateur modifié' : 'تم تعديل المستخدم');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleSuspend = async (user) => {
    const reason = window.prompt(language === 'fr' ? 'Raison de la suspension (optionnel):' : 'سبب التعليق (اختياري):');
    if (reason === null) return; // User cancelled
    
    try {
      await axios.post(`${API}/admin/users/${user.id}/suspend?reason=${encodeURIComponent(reason)}`, {}, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Compte suspendu' : 'تم تعليق الحساب');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleActivate = async (user) => {
    try {
      await axios.post(`${API}/admin/users/${user.id}/activate`, {}, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Compte activé' : 'تم تفعيل الحساب');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const openSubscriptionDialog = (user) => {
    setSelectedUser(user);
    setSubscriptionType(user.subscription_type || 'annual');
    setShowSubscriptionDialog(true);
  };
  
  const handleUpdateSubscription = async () => {
    try {
      await axios.post(`${API}/admin/users/${selectedUser.id}/subscription?subscription_type=${subscriptionType}`, {}, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Abonnement mis à jour' : 'تم تحديث الاشتراك');
      setShowSubscriptionDialog(false);
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleDelete = async (user) => {
    if (!window.confirm(`${language === 'fr' ? 'Supprimer définitivement' : 'حذف نهائي'} ${user.full_name}? ${language === 'fr' ? 'Toutes les données seront supprimées.' : 'سيتم حذف جميع البيانات.'}`)) return;
    try {
      await axios.delete(`${API}/admin/users/${user.id}`, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Utilisateur supprimé' : 'تم حذف المستخدم');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const getStatusBadge = (user) => {
    if (user.is_suspended) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-1"><Ban size={12} /> Suspendu</span>;
    }
    if (user.is_expired) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 flex items-center gap-1"><Clock size={12} /> Expiré</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12} /> Actif</span>;
  };
  
  const getSubscriptionBadge = (user) => {
    if (user.role === 'superadmin') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Admin</span>;
    }
    if (user.role === 'employee') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">Employé</span>;
    }
    
    const type = user.subscription_type || 'trial';
    const badges = {
      trial: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Clock size={12} /> Essai ({user.days_remaining}j)</span>,
      annual: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><Crown size={12} /> Annuel</span>,
      lifetime: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1"><Sparkles size={12} /> Illimité</span>,
    };
    return badges[type] || badges.trial;
  };
  
  const getRoleBadge = (role) => {
    const badges = {
      superadmin: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 flex items-center gap-1"><Shield size={12} /> SuperAdmin</span>,
      locateur: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Building2 size={12} /> Locateur</span>,
      employee: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-700 flex items-center gap-1"><Users size={12} /> Employé</span>,
    };
    return badges[role] || role;
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !user.is_suspended && !user.is_expired) ||
      (statusFilter === 'suspended' && user.is_suspended) ||
      (statusFilter === 'expired' && user.is_expired);
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Calculate stats
  const activeLocateurs = users.filter(u => u.role === 'locateur' && !u.is_suspended && !u.is_expired).length;
  const trialUsers = users.filter(u => u.subscription_type === 'trial' && u.role === 'locateur').length;
  const suspendedUsers = users.filter(u => u.is_suspended).length;
  const expiredUsers = users.filter(u => u.is_expired && u.role === 'locateur').length;
  
  if (loading) return <Layout><div className="text-center py-12">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</div></Layout>;
  
  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              👑 {language === 'fr' ? 'Gestion de la Plateforme' : 'إدارة المنصة'}
            </h1>
            <p className="text-slate-500 mt-1">{language === 'fr' ? 'Gérez tous les utilisateurs et abonnements' : 'إدارة جميع المستخدمين والاشتراكات'}</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50">
            <RefreshCw size={16} className="me-2" /> {language === 'fr' ? 'Actualiser' : 'تحديث'}
          </Button>
        </div>
        
        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Shield className="text-purple-500" size={24} />
                <div>
                  <p className="text-2xl font-bold text-purple-800">{stats.superadmins || 0}</p>
                  <p className="text-xs text-purple-600">SuperAdmins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Building2 className="text-blue-500" size={24} />
                <div>
                  <p className="text-2xl font-bold text-blue-800">{stats.total_locateurs || 0}</p>
                  <p className="text-xs text-blue-600">Locateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="text-2xl font-bold text-green-800">{activeLocateurs}</p>
                  <p className="text-xs text-green-600">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-500" size={24} />
                <div>
                  <p className="text-2xl font-bold text-blue-800">{trialUsers}</p>
                  <p className="text-xs text-blue-600">En essai</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={24} />
                <div>
                  <p className="text-2xl font-bold text-orange-800">{expiredUsers}</p>
                  <p className="text-xs text-orange-600">Expirés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Ban className="text-red-500" size={24} />
                <div>
                  <p className="text-2xl font-bold text-red-800">{suspendedUsers}</p>
                  <p className="text-xs text-red-600">Suspendus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Card className="mb-6 bg-white border-2 border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder={language === 'fr' ? 'Rechercher par nom, email, entreprise...' : 'البحث بالاسم أو البريد أو الشركة...'} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="ps-10 h-10 bg-slate-50 border-slate-300" 
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px] h-10">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'fr' ? 'Tous les rôles' : 'كل الأدوار'}</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                  <SelectItem value="locateur">Locateur</SelectItem>
                  <SelectItem value="employee">Employé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-10">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'fr' ? 'Tous les statuts' : 'كل الحالات'}</SelectItem>
                  <SelectItem value="active">{language === 'fr' ? 'Actifs' : 'نشط'}</SelectItem>
                  <SelectItem value="suspended">{language === 'fr' ? 'Suspendus' : 'معلق'}</SelectItem>
                  <SelectItem value="expired">{language === 'fr' ? 'Expirés' : 'منتهي'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Users Table */}
        <Card className="bg-white border-2 border-slate-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-start p-4 font-semibold text-slate-700">{language === 'fr' ? 'Statut' : 'الحالة'}</th>
                  <th className="text-start p-4 font-semibold text-slate-700">{language === 'fr' ? 'Abonnement' : 'الاشتراك'}</th>
                  <th className="text-start p-4 font-semibold text-slate-700">{language === 'fr' ? 'Rôle' : 'الدور'}</th>
                  <th className="text-start p-4 font-semibold text-slate-700">{language === 'fr' ? 'Nom / Entreprise' : 'الاسم / الشركة'}</th>
                  <th className="text-start p-4 font-semibold text-slate-700">Email</th>
                  <th className="text-start p-4 font-semibold text-slate-700">{language === 'fr' ? 'Dernière connexion' : 'آخر اتصال'}</th>
                  <th className="text-start p-4 font-semibold text-slate-700">{language === 'fr' ? 'Stats' : 'إحصائيات'}</th>
                  <th className="text-center p-4 font-semibold text-slate-700">{language === 'fr' ? 'Actions' : 'الإجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${user.is_suspended ? 'bg-red-50/50' : user.is_expired ? 'bg-orange-50/50' : ''}`}
                  >
                    <td className="p-4">{getStatusBadge(user)}</td>
                    <td className="p-4">{getSubscriptionBadge(user)}</td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-800">{user.full_name}</p>
                        {user.company_name && (
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Building2 size={12} /> {user.company_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-600">{user.email}</p>
                      {user.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {user.last_login ? (
                          <>
                            <p className="text-slate-600">
                              {new Date(user.last_login).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {user.last_ip && (
                              <p className="text-xs text-slate-400 font-mono">
                                IP: {user.last_ip}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-400 text-xs">{language === 'fr' ? 'Jamais connecté' : 'لم يتصل أبداً'}</p>
                        )}
                        {user.subscription_end && user.role === 'locateur' && (
                          <p className="text-xs text-orange-500 mt-1">
                            {language === 'fr' ? 'Exp' : 'ينتهي'}: {new Date(user.subscription_end).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {user.role === 'locateur' && (
                        <div className="flex gap-3 text-xs">
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Car size={12} /> {user.vehicle_count || 0}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <Users size={12} /> {user.employee_count || 0}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        {user.role !== 'superadmin' && (
                          <>
                            <Button 
                              onClick={() => handleEdit(user)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-cyan-600 hover:bg-cyan-50 h-8 w-8 p-0"
                              title={language === 'fr' ? 'Modifier' : 'تعديل'}
                            >
                              <Edit size={16} />
                            </Button>
                            
                            {user.role === 'locateur' && (
                              <Button 
                                onClick={() => openSubscriptionDialog(user)} 
                                variant="ghost" 
                                size="sm" 
                                className="text-emerald-600 hover:bg-emerald-50 h-8 w-8 p-0"
                                title={language === 'fr' ? 'Gérer abonnement' : 'إدارة الاشتراك'}
                              >
                                <Crown size={16} />
                              </Button>
                            )}
                            
                            {user.is_suspended ? (
                              <Button 
                                onClick={() => handleActivate(user)} 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                                title={language === 'fr' ? 'Activer' : 'تفعيل'}
                              >
                                <CheckCircle size={16} />
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => handleSuspend(user)} 
                                variant="ghost" 
                                size="sm" 
                                className="text-orange-600 hover:bg-orange-50 h-8 w-8 p-0"
                                title={language === 'fr' ? 'Suspendre' : 'تعليق'}
                              >
                                <Ban size={16} />
                              </Button>
                            )}
                            
                            <Button 
                              onClick={() => handleDelete(user)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                              title={language === 'fr' ? 'Supprimer' : 'حذف'}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                        {user.role === 'superadmin' && (
                          <span className="text-xs text-slate-400 italic">{language === 'fr' ? 'Protégé' : 'محمي'}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">{language === 'fr' ? 'Aucun utilisateur trouvé' : 'لم يتم العثور على مستخدمين'}</p>
            </div>
          )}
        </Card>
        
        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-purple-600 font-heading text-xl flex items-center gap-2">
                <Edit size={20} /> {language === 'fr' ? 'Modifier l\'utilisateur' : 'تعديل المستخدم'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">{selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              {selectedUser?.role === 'locateur' && (
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Nom entreprise' : 'اسم الشركة'}</Label>
                  <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="bg-white border-2 border-slate-300" />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Nom complet' : 'الاسم الكامل'}</Label>
                <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-white border-2 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-white border-2 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-white border-2 border-slate-300" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="border-2 border-slate-300">
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  {language === 'fr' ? 'Enregistrer' : 'حفظ'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Subscription Dialog */}
        <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
          <DialogContent className="max-w-md bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-emerald-600 font-heading text-xl flex items-center gap-2">
                <Crown size={20} /> {language === 'fr' ? 'Gérer l\'abonnement' : 'إدارة الاشتراك'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {selectedUser?.full_name} - {selectedUser?.company_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">{language === 'fr' ? 'Abonnement actuel:' : 'الاشتراك الحالي:'}</p>
                <div className="flex items-center gap-2">
                  {getSubscriptionBadge(selectedUser || {})}
                  {selectedUser?.subscription_end && (
                    <span className="text-sm text-slate-500">
                      → {new Date(selectedUser.subscription_end).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Nouveau type d\'abonnement' : 'نوع الاشتراك الجديد'}</Label>
                <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" />
                        {language === 'fr' ? 'Essai (15 jours)' : 'تجريبي (15 يوم)'}
                      </div>
                    </SelectItem>
                    <SelectItem value="annual">
                      <div className="flex items-center gap-2">
                        <Crown size={14} className="text-emerald-500" />
                        {language === 'fr' ? 'Annuel (1 an)' : 'سنوي (سنة واحدة)'}
                      </div>
                    </SelectItem>
                    <SelectItem value="lifetime">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500" />
                        {language === 'fr' ? 'Illimité (à vie)' : 'غير محدود (مدى الحياة)'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700">
                  {subscriptionType === 'trial' && (language === 'fr' ? '⏱️ L\'utilisateur aura 15 jours d\'accès à partir d\'aujourd\'hui.' : '⏱️ سيحصل المستخدم على 15 يومًا من الوصول اعتبارًا من اليوم.')}
                  {subscriptionType === 'annual' && (language === 'fr' ? '📅 L\'utilisateur aura 1 an d\'accès à partir d\'aujourd\'hui.' : '📅 سيحصل المستخدم على سنة واحدة من الوصول اعتبارًا من اليوم.')}
                  {subscriptionType === 'lifetime' && (language === 'fr' ? '✨ L\'utilisateur aura un accès illimité permanent.' : '✨ سيحصل المستخدم على وصول غير محدود دائم.')}
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowSubscriptionDialog(false)} className="border-2 border-slate-300">
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </Button>
                <Button onClick={handleUpdateSubscription} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                  {language === 'fr' ? 'Mettre à jour' : 'تحديث'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SuperAdminPage;
