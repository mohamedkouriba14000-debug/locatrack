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
import { Search, Building2, Users, Car, FileText, Trash2, Edit, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SuperAdminPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [locateurs, setLocateurs] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [expandedLocateur, setExpandedLocateur] = useState(null);
  const [employees, setEmployees] = useState({});
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', company_name: '' });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [locateursRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/locateurs`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() })
      ]);
      setLocateurs(locateursRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEmployees = async (locateurId) => {
    if (employees[locateurId]) {
      setExpandedLocateur(expandedLocateur === locateurId ? null : locateurId);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/admin/users`, { headers: getAuthHeaders() });
      const locateurEmployees = response.data.filter(u => u.tenant_id === locateurId && u.role === 'employee');
      setEmployees({ ...employees, [locateurId]: locateurEmployees });
      setExpandedLocateur(locateurId);
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleEdit = (user) => {
    setEditingUser(user);
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
      await axios.put(`${API}/admin/users/${editingUser.id}`, formData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Utilisateur modifié' : 'تم تعديل المستخدم');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`${language === 'fr' ? 'Supprimer' : 'حذف'} ${userName}? ${language === 'fr' ? 'Toutes les données seront supprimées.' : 'سيتم حذف جميع البيانات.'}`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Utilisateur supprimé' : 'تم حذف المستخدم');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const filteredLocateurs = locateurs.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600">
            👑 {language === 'fr' ? 'Administration Plateforme' : 'إدارة المنصة'}
          </h1>
        </div>
        
        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">{language === 'fr' ? 'Locateurs' : 'المؤجرون'}</p>
                  <p className="text-3xl font-bold text-amber-800">{stats.total_locateurs || 0}</p>
                </div>
                <Building2 className="text-amber-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">{language === 'fr' ? 'Employés' : 'الموظفون'}</p>
                  <p className="text-3xl font-bold text-blue-800">{stats.total_employees || 0}</p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">{language === 'fr' ? 'Véhicules (total)' : 'المركبات (الإجمالي)'}</p>
                  <p className="text-3xl font-bold text-emerald-800">{stats.total_vehicles_platform || 0}</p>
                </div>
                <Car className="text-emerald-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-violet-600 font-medium">{language === 'fr' ? 'Contrats (total)' : 'العقود (الإجمالي)'}</p>
                  <p className="text-3xl font-bold text-violet-800">{stats.total_contracts_platform || 0}</p>
                </div>
                <FileText className="text-violet-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder={language === 'fr' ? 'Rechercher un locateur...' : 'البحث عن مؤجر...'} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-amber-500" 
            />
          </div>
        </div>
        
        {/* Locateurs List */}
        <div className="space-y-4">
          {filteredLocateurs.map((locateur) => (
            <Card key={locateur.id} className="bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                      <Building2 size={28} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">{locateur.company_name}</CardTitle>
                      <p className="text-sm text-slate-500">{locateur.full_name} • {locateur.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleEdit(locateur)} variant="outline" size="sm" className="border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50">
                      <Edit size={16} />
                    </Button>
                    <Button onClick={() => handleDelete(locateur.id, locateur.company_name)} variant="outline" size="sm" className="border-2 border-red-300 text-red-600 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Locateur Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                    <Car size={20} className="mx-auto text-emerald-600 mb-1" />
                    <p className="text-2xl font-bold text-emerald-700">{locateur.vehicle_count || 0}</p>
                    <p className="text-xs text-emerald-600">{language === 'fr' ? 'Véhicules' : 'مركبات'}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <Users size={20} className="mx-auto text-blue-600 mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{locateur.employee_count || 0}</p>
                    <p className="text-xs text-blue-600">{language === 'fr' ? 'Employés' : 'موظفون'}</p>
                  </div>
                  <div className="p-3 bg-violet-50 rounded-lg border border-violet-200 text-center">
                    <FileText size={20} className="mx-auto text-violet-600 mb-1" />
                    <p className="text-2xl font-bold text-violet-700">{locateur.contract_count || 0}</p>
                    <p className="text-xs text-violet-600">{language === 'fr' ? 'Contrats' : 'عقود'}</p>
                  </div>
                </div>
                
                {/* Employees Toggle */}
                {locateur.employee_count > 0 && (
                  <div>
                    <Button 
                      onClick={() => fetchEmployees(locateur.id)} 
                      variant="ghost" 
                      className="w-full justify-between text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <span>{language === 'fr' ? 'Voir les employés' : 'عرض الموظفين'} ({locateur.employee_count})</span>
                      {expandedLocateur === locateur.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                    
                    {expandedLocateur === locateur.id && employees[locateur.id] && (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                        {employees[locateur.id].map((emp) => (
                          <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {emp.full_name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{emp.full_name}</p>
                                <p className="text-xs text-slate-500">{emp.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleEdit(emp)} variant="ghost" size="sm" className="text-cyan-600">
                                <Edit size={14} />
                              </Button>
                              <Button onClick={() => handleDelete(emp.id, emp.full_name)} variant="ghost" size="sm" className="text-red-600">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-slate-400 mt-3">
                  {language === 'fr' ? 'Inscrit le' : 'مسجل في'}: {new Date(locateur.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredLocateurs.length === 0 && (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{language === 'fr' ? 'Aucun locateur inscrit' : 'لا يوجد مؤجرون مسجلون'}</p>
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-amber-600 font-heading text-2xl">{language === 'fr' ? 'Modifier' : 'تعديل'}</DialogTitle>
              <DialogDescription className="text-slate-600">{editingUser?.full_name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              {editingUser?.role === 'locateur' && (
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
