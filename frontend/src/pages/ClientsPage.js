import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Plus, Users, Edit, Trash2, Search, Phone, CreditCard, Calendar, Upload, FileImage, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    license_number: '',
    license_issue_date: '',
    license_image_url: '',
    address: '',
    notes: ''
  });
  
  useEffect(() => { fetchClients(); }, []);
  
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (file, isEdit = false) => {
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(language === 'fr' ? 'Type de fichier non autorisé. Utilisez JPEG, PNG ou PDF.' : 'نوع الملف غير مسموح. استخدم JPEG أو PNG أو PDF.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'fr' ? 'Fichier trop volumineux (max 5MB)' : 'الملف كبير جدًا (الحد الأقصى 5 ميجابايت)');
      return;
    }
    
    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    try {
      const response = await axios.post(`${API}/clients/upload-license`, uploadFormData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData(prev => ({ ...prev, license_image_url: response.data.url }));
      toast.success(language === 'fr' ? 'Image téléchargée avec succès' : 'تم تحميل الصورة بنجاح');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setUploading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.license_issue_date) {
      toast.error(language === 'fr' ? 'La date de délivrance du permis est requise' : 'تاريخ إصدار الرخصة مطلوب');
      return;
    }
    
    try {
      const clientData = {
        ...formData,
        license_issue_date: new Date(formData.license_issue_date).toISOString()
      };
      
      await axios.post(`${API}/clients`, clientData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Client créé avec succès' : 'تم إنشاء العميل بنجاح');
      setShowDialog(false);
      resetForm();
      fetchClients();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name || '',
      phone: client.phone || '',
      license_number: client.license_number || '',
      license_issue_date: client.license_issue_date ? client.license_issue_date.split('T')[0] : '',
      license_image_url: client.license_image_url || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        license_number: formData.license_number,
        license_issue_date: formData.license_issue_date ? new Date(formData.license_issue_date).toISOString() : null,
        license_image_url: formData.license_image_url,
        address: formData.address,
        notes: formData.notes
      };
      
      await axios.put(`${API}/clients/${editingClient.id}`, updateData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Client modifié' : 'تم تعديل العميل');
      setShowEditDialog(false);
      resetForm();
      fetchClients();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleDelete = async (clientId, name) => {
    if (!window.confirm(`${language === 'fr' ? 'Supprimer' : 'حذف'} ${name}?`)) return;
    try {
      await axios.delete(`${API}/clients/${clientId}`, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Client supprimé' : 'تم حذف العميل');
      fetchClients();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const resetForm = () => {
    setEditingClient(null);
    setFormData({
      full_name: '',
      phone: '',
      license_number: '',
      license_issue_date: '',
      license_image_url: '',
      address: '',
      notes: ''
    });
  };
  
  const viewLicenseImage = (url) => {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`;
      setSelectedImage(fullUrl);
      setShowImageDialog(true);
    }
  };
  
  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</div></Layout>;
  
  const renderForm = (onSubmit, isEdit = false) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Nom complet' : 'الاسم الكامل'} *</Label>
          <Input
            required
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            placeholder={language === 'fr' ? 'Prénom et Nom' : 'الاسم الأول والأخير'}
            className="bg-white border-2 border-slate-300 focus:border-teal-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Téléphone' : 'الهاتف'} *</Label>
          <Input
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+213 5XX XXX XXX"
            className="bg-white border-2 border-slate-300 focus:border-teal-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'N° Permis de Conduire' : 'رقم رخصة القيادة'} *</Label>
          <Input
            required
            value={formData.license_number}
            onChange={(e) => setFormData({...formData, license_number: e.target.value})}
            placeholder="123456789"
            className="bg-white border-2 border-slate-300 focus:border-teal-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Date de Délivrance' : 'تاريخ الإصدار'} *</Label>
          <Input
            type="date"
            required
            value={formData.license_issue_date}
            onChange={(e) => setFormData({...formData, license_issue_date: e.target.value})}
            className="bg-white border-2 border-slate-300 focus:border-teal-500"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Adresse' : 'العنوان'}</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder={language === 'fr' ? 'Adresse complète' : 'العنوان الكامل'}
          className="bg-white border-2 border-slate-300 focus:border-teal-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Copie du Permis' : 'نسخة من الرخصة'}</Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          {formData.license_image_url ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-600">
                <FileImage size={20} />
                <span className="text-sm font-medium">{language === 'fr' ? 'Image téléchargée' : 'تم تحميل الصورة'}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => viewLicenseImage(formData.license_image_url)}
                  className="border-teal-300 text-teal-600 hover:bg-teal-50"
                >
                  <Eye size={16} className="me-1" /> {language === 'fr' ? 'Voir' : 'عرض'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({...formData, license_image_url: ''})}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <input
                type="file"
                ref={isEdit ? editFileInputRef : fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files[0], isEdit)}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => (isEdit ? editFileInputRef : fileInputRef).current?.click()}
                disabled={uploading}
                className="border-2 border-teal-300 text-teal-600 hover:bg-teal-50"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
                    {language === 'fr' ? 'Téléchargement...' : 'جاري التحميل...'}
                  </span>
                ) : (
                  <>
                    <Upload size={16} className="me-2" />
                    {language === 'fr' ? 'Télécharger une image' : 'تحميل صورة'}
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 mt-2">{language === 'fr' ? 'JPEG, PNG ou PDF (max 5MB)' : 'JPEG أو PNG أو PDF (الحد الأقصى 5 ميجابايت)'}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Notes' : 'ملاحظات'}</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder={language === 'fr' ? 'Notes optionnelles...' : 'ملاحظات اختيارية...'}
          className="bg-white border-2 border-slate-300 focus:border-teal-500"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => { isEdit ? setShowEditDialog(false) : setShowDialog(false); resetForm(); }} 
          className="border-2 border-slate-300"
        >
          {language === 'fr' ? 'Annuler' : 'إلغاء'}
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
        >
          {isEdit ? (language === 'fr' ? 'Enregistrer' : 'حفظ') : (language === 'fr' ? 'Créer' : 'إنشاء')}
        </Button>
      </div>
    </form>
  );
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
            👤 {language === 'fr' ? 'Mes Clients' : 'عملائي'}
          </h1>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> {language === 'fr' ? 'Ajouter Client' : 'إضافة عميل'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white border-2 border-slate-200 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-teal-600 font-heading text-2xl flex items-center gap-2">
                  <Plus size={24} /> {language === 'fr' ? 'Nouveau Client' : 'عميل جديد'}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {language === 'fr' ? 'Ajoutez les informations du client' : 'أضف معلومات العميل'}
                </DialogDescription>
              </DialogHeader>
              {renderForm(handleSubmit, false)}
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder={language === 'fr' ? 'Rechercher un client...' : 'البحث عن عميل...'} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-teal-500" 
            />
          </div>
        </div>
        
        {/* Stats */}
        <Card className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-600 font-medium">{language === 'fr' ? 'Total Clients' : 'إجمالي العملاء'}</p>
                <p className="text-3xl font-bold text-teal-800">{clients.length}</p>
              </div>
              <Users className="text-teal-500" size={48} />
            </div>
          </CardContent>
        </Card>
        
        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                    {client.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800">{client.full_name}</CardTitle>
                    <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-semibold">
                      👤 {language === 'fr' ? 'Client' : 'عميل'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={16} className="text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CreditCard size={16} className="text-slate-400" />
                    <span>{language === 'fr' ? 'Permis' : 'الرخصة'}: {client.license_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{language === 'fr' ? 'Délivré le' : 'صدر في'}: {client.license_issue_date ? new Date(client.license_issue_date).toLocaleDateString() : '-'}</span>
                  </div>
                  {client.license_image_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewLicenseImage(client.license_image_url)}
                      className="w-full mt-2 border-teal-300 text-teal-600 hover:bg-teal-50"
                    >
                      <FileImage size={16} className="me-2" /> {language === 'fr' ? 'Voir le permis' : 'عرض الرخصة'}
                    </Button>
                  )}
                  {client.address && (
                    <p className="text-xs text-slate-500 mt-2 truncate" title={client.address}>
                      📍 {client.address}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleEdit(client)} variant="outline" size="sm" className="flex-1 border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50">
                    <Edit size={16} className="me-1" /> {language === 'fr' ? 'Modifier' : 'تعديل'}
                  </Button>
                  <Button onClick={() => handleDelete(client.id, client.full_name)} variant="outline" size="sm" className="border-2 border-red-300 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{language === 'fr' ? 'Aucun client' : 'لا يوجد عملاء'}</p>
            <p className="text-sm text-slate-400 mt-2">{language === 'fr' ? 'Cliquez sur "Ajouter Client" pour créer votre premier client' : 'انقر على "إضافة عميل" لإنشاء أول عميل لك'}</p>
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-lg bg-white border-2 border-slate-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-teal-600 font-heading text-2xl">{language === 'fr' ? 'Modifier Client' : 'تعديل العميل'}</DialogTitle>
              <DialogDescription className="text-slate-600">{editingClient?.full_name}</DialogDescription>
            </DialogHeader>
            {renderForm(handleUpdate, true)}
          </DialogContent>
        </Dialog>
        
        {/* Image Viewer Dialog */}
        {showImageDialog && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowImageDialog(false)}>
            <div className="relative max-w-4xl max-h-[90vh] m-4" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(false)}
                className="absolute -top-10 right-0 text-white hover:bg-white/20"
              >
                <X size={24} /> {language === 'fr' ? 'Fermer' : 'إغلاق'}
              </Button>
              {selectedImage.endsWith('.pdf') ? (
                <iframe src={selectedImage} className="w-full h-[80vh] bg-white rounded-lg" title="License PDF" />
              ) : (
                <img src={selectedImage} alt="License" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientsPage;
