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
import { Search, Users, Shield, UserCog, Trash2, Edit, Crown, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SuperAdminPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', role: '', phone: '' });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers: getAuthHeaders() }),
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
    setEditingUser(user);
    setFormData({ full_name: user.full_name, email: user.email, role: user.role, phone: user.phone || '' });
    setShowEditDialog(true);
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/users/${editingUser.id}`, formData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Utilisateur modifié' : 'تم تعديل المستخدم');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`${language === 'fr' ? 'Supprimer' : 'حذف'} ${userName}?`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Utilisateur supprimé' : 'تم حذف المستخدم');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const getRoleIcon = (role) => {
    switch(role) {
      case 'superadmin': return <Crown className="text-amber-500" size={20} />;
      case 'admin': return <Shield className="text-red-500" size={20} />;
      default: return <UserCog className="text-blue-500" size={20} />;
    }
  };
  
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'superadmin': return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300';
      case 'admin': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      default: return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
    }
  };
  
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600">
            {language === 'fr' ? '👑 Super Admin' : '👑 المدير العام'}
          </h1>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">{language === 'fr' ? 'Total Utilisateurs' : 'إجمالي المستخدمين'}</p>
                  <p className="text-3xl font-bold text-amber-800">{stats.total_users || 0}</p>
                </div>
                <Users className="text-amber-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Admins</p>
                  <p className="text-3xl font-bold text-red-800">{stats.admins || 0}</p>
                </div>
                <Shield className="text-red-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">{language === 'fr' ? 'Employés' : 'الموظفون'}</p>
                  <p className="text-3xl font-bold text-blue-800">{stats.employees || 0}</p>
                </div>
                <UserCog className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">{language === 'fr' ? 'Véhicules' : 'المركبات'}</p>
                  <p className="text-3xl font-bold text-emerald-800">{stats.total_vehicles || 0}</p>
                </div>
                <BarChart3 className="text-emerald-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder={language === 'fr' ? 'Rechercher un utilisateur...' : 'البحث عن مستخدم...'} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-amber-500" 
            />
          </div>
        </div>
        
        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${user.role === 'superadmin' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : user.role === 'admin' ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800">{user.full_name}</CardTitle>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase border-2 ${getRoleBadgeColor(user.role)}`}>
                    {user.role === 'superadmin' ? '👑 Super Admin' : user.role === 'admin' ? '🔑 Admin' : '👤 ' + (language === 'fr' ? 'Employé' : 'موظف')}
                  </div>
                  {user.phone && <p className="text-sm text-slate-600">📞 {user.phone}</p>}
                  <p className="text-xs text-slate-400">{language === 'fr' ? 'Inscrit le' : 'مسجل في'}: {new Date(user.created_at).toLocaleDateString()}</p>
                  
                  {user.role !== 'superadmin' && (
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleEdit(user)} variant="outline" size="sm" className="flex-1 border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50">
                        <Edit size={16} className="me-1" /> {language === 'fr' ? 'Modifier' : 'تعديل'}
                      </Button>
                      <Button onClick={() => handleDelete(user.id, user.full_name)} variant="outline" size="sm" className="border-2 border-red-300 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{language === 'fr' ? 'Aucun utilisateur trouvé' : 'لم يتم العثور على مستخدمين'}</p>
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-amber-600 font-heading text-2xl">{language === 'fr' ? 'Modifier Utilisateur' : 'تعديل المستخدم'}</DialogTitle>
              <DialogDescription className="text-slate-600">{editingUser?.full_name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Nom complet' : 'الاسم الكامل'}</Label>
                <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-amber-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-amber-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Rôle' : 'الدور'}</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">🔑 Admin</SelectItem>
                    <SelectItem value="employee">👤 {language === 'fr' ? 'Employé' : 'موظف'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-amber-500" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="border-2 border-slate-300">{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
                <Button type="submit" className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white">{language === 'fr' ? 'Enregistrer' : 'حفظ'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SuperAdminPage;
