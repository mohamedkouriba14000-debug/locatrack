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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, UserCog, Mail, Phone, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmployeesPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'employee'
  });
  
  useEffect(() => { fetchEmployees(); }, []);
  
  const fetchEmployees = async () => {
    try {
      // Note: Endpoint fictif, à adapter selon votre API
      const response = await axios.get(`${API}/auth/users?role=employee,admin`, { headers: getAuthHeaders() });
      setEmployees(response.data || []);
      playSyntheticSound('success');
    } catch (error) {
      // Si l'endpoint n'existe pas, créons des données de démo
      setEmployees([
        { id: '1', email: 'admin@vehicletrack.dz', full_name: 'Admin User', role: 'admin', phone: '+213555123456' },
        { id: '2', email: 'employee@vehicletrack.dz', full_name: 'Mohammed Benali', role: 'employee', phone: '+213555987654' }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    playSyntheticSound('click');
    try {
      await axios.post(`${API}/auth/register`, formData, { headers: getAuthHeaders() });
      toast.success('Employé ajouté avec succès');
      playSyntheticSound('success');
      setShowDialog(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout');
      playSyntheticSound('error');
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression de cet employé?')) return;
    playSyntheticSound('click');
    toast.info('Fonctionnalité de suppression à implémenter');
  };
  
  const resetForm = () => {
    setFormData({ email: '', password: '', full_name: '', phone: '', role: 'employee' });
  };
  
  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getRoleColor = (role) => {
    return role === 'admin' ? 'from-red-500 to-pink-500' : 'from-blue-500 to-cyan-500';
  };
  
  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300';
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
            {language === 'fr' ? '👥 Employés' : '👥 الموظفون'}
          </h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> {language === 'fr' ? 'Ajouter Employé' : 'إضافة موظف'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-blue-600 font-heading text-2xl">{language === 'fr' ? 'Nouvel Employé' : 'موظف جديد'}</DialogTitle>
                <DialogDescription className="text-slate-600">{language === 'fr' ? 'Créer un nouveau compte employé ou administrateur' : 'إنشاء حساب موظف أو مدير جديد'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t('fullName')}</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-blue-500" placeholder="Mohammed Benali" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t('email')}</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-blue-500" placeholder="employe@vehicletrack.dz" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t('password')}</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-blue-500" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t('phone')}</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} onFocus={() => playSyntheticSound('click')} className="bg-white border-2 border-slate-300 focus:border-blue-500" placeholder="+213555123456" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t('role')}</Label>
                  <Select value={formData.role} onValueChange={(value) => { playSyntheticSound('click'); setFormData({...formData, role: value}); }}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">{language === 'fr' ? '👤 Employé' : '👤 موظف'}</SelectItem>
                      <SelectItem value="admin">{language === 'fr' ? '🔑 Administrateur' : '🔑 مدير'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { playSyntheticSound('click'); setShowDialog(false); }} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">{language === 'fr' ? 'Créer' : 'إنشاء'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={language === 'fr' ? 'Rechercher un employé...' : 'البحث عن موظف...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => playSyntheticSound('click')} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-blue-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-4 bg-gradient-to-br ${getRoleColor(employee.role)} rounded-full shadow-md`}>
                    {employee.role === 'admin' ? <Shield size={28} className="text-white" /> : <UserCog size={28} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800">{employee.full_name}</CardTitle>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-lg text-xs font-bold uppercase border-2 ${getRoleBadgeColor(employee.role)}`}>
                      {employee.role === 'admin' ? (language === 'fr' ? 'Admin' : 'مدير') : (language === 'fr' ? 'Employé' : 'موظف')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-700">{employee.phone}</span>
                    </div>
                  )}
                  <Button onClick={() => handleDelete(employee.id)} variant="outline" size="sm" className="w-full mt-2 border-2 border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} className="me-2" /> {language === 'fr' ? 'Supprimer' : 'حذف'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UserCog size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{t('noData')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeesPage;