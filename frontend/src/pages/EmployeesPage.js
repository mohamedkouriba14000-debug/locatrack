import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Plus, Users, Edit, Trash2, Search, Phone, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmployeesPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  
  useEffect(() => { fetchEmployees(); }, []);
  
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`, { headers: getAuthHeaders() });
      setEmployees(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast.error(language === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' : 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
      return;
    }
    
    try {
      await axios.post(`${API}/employees`, formData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Employé créé avec succès' : 'تم إنشاء الموظف بنجاح');
      setShowDialog(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || '',
      password: ''
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = { full_name: formData.full_name, email: formData.email, phone: formData.phone };
      await axios.put(`${API}/employees/${editingEmployee.id}`, updateData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Employé modifié' : 'تم تعديل الموظف');
      setShowEditDialog(false);
      fetchEmployees();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleDelete = async (employeeId, name) => {
    if (!window.confirm(`${language === 'fr' ? 'Supprimer' : 'حذف'} ${name}?`)) return;
    try {
      await axios.delete(`${API}/employees/${employeeId}`, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Employé supprimé' : 'تم حذف الموظف');
      fetchEmployees();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const resetForm = () => {
    setFormData({ full_name: '', email: '', phone: '', password: '' });
  };
  
  const filteredEmployees = employees.filter(e =>
    e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            👥 {language === 'fr' ? 'Mes Employés' : 'موظفيني'}
          </h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                <UserPlus size={20} className="me-2" /> {language === 'fr' ? 'Ajouter Employé' : 'إضافة موظف'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-blue-600 font-heading text-2xl flex items-center gap-2">
                  <UserPlus size={24} /> {language === 'fr' ? 'Nouvel Employé' : 'موظف جديد'}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {language === 'fr' ? 'Créez un compte pour votre employé' : 'أنشئ حسابًا لموظفك'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Nom complet' : 'الاسم الكامل'} *</Label>
                  <Input
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder={language === 'fr' ? 'Prénom et Nom' : 'الاسم الأول والأخير'}
                    className="bg-white border-2 border-slate-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Email *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="employe@exemple.com"
                    className="bg-white border-2 border-slate-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+213 5XX XXX XXX"
                    className="bg-white border-2 border-slate-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Mot de passe' : 'كلمة المرور'} *</Label>
                  <Input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="bg-white border-2 border-slate-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">{language === 'fr' ? 'L\'employé utilisera ce mot de passe pour se connecter' : 'سيستخدم الموظف كلمة المرور هذه لتسجيل الدخول'}</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="border-2 border-slate-300">
                    {language === 'fr' ? 'Annuler' : 'إلغاء'}
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                    {language === 'fr' ? 'Créer' : 'إنشاء'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder={language === 'fr' ? 'Rechercher un employé...' : 'البحث عن موظف...'} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-blue-500" 
            />
          </div>
        </div>
        
        {/* Stats */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">{language === 'fr' ? 'Total Employés' : 'إجمالي الموظفين'}</p>
                <p className="text-3xl font-bold text-blue-800">{employees.length}</p>
              </div>
              <Users className="text-blue-500" size={48} />
            </div>
          </CardContent>
        </Card>
        
        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                    {employee.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800">{employee.full_name}</CardTitle>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      👤 {language === 'fr' ? 'Employé' : 'موظف'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={16} className="text-slate-400" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={16} className="text-slate-400" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {language === 'fr' ? 'Créé le' : 'تم الإنشاء في'}: {new Date(employee.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleEdit(employee)} variant="outline" size="sm" className="flex-1 border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50">
                    <Edit size={16} className="me-1" /> {language === 'fr' ? 'Modifier' : 'تعديل'}
                  </Button>
                  <Button onClick={() => handleDelete(employee.id, employee.full_name)} variant="outline" size="sm" className="border-2 border-red-300 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{language === 'fr' ? 'Aucun employé' : 'لا يوجد موظفون'}</p>
            <p className="text-sm text-slate-400 mt-2">{language === 'fr' ? 'Cliquez sur "Ajouter Employé" pour créer votre premier employé' : 'انقر على "إضافة موظف" لإنشاء أول موظف لك'}</p>
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-blue-600 font-heading text-2xl">{language === 'fr' ? 'Modifier Employé' : 'تعديل الموظف'}</DialogTitle>
              <DialogDescription className="text-slate-600">{editingEmployee?.full_name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
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
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">{language === 'fr' ? 'Enregistrer' : 'حفظ'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EmployeesPage;
