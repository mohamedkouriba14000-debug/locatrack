import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Languages, ArrowRight, Car, Sparkles, Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RegisterPage = () => {
  const { toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'كلمات المرور غير متطابقة');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error(language === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' : 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, {
        company_name: formData.company_name,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      // Store token and user
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success(language === 'fr' ? 'Compte créé avec succès ! Bienvenue sur LocaTrack' : 'تم إنشاء الحساب بنجاح! مرحبًا بك في LocaTrack');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden" data-testid="register-page">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 start-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 end-20 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 start-1/2 w-48 h-48 bg-violet-200/30 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Top controls */}
      <div className="absolute top-6 end-6 z-10 flex gap-2">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="glass-light hover:neon-shadow"
        >
          <Languages size={18} className="me-2 text-violet-600" />
          <span className="text-slate-700 font-medium">{language === 'fr' ? 'العربية' : 'Français'}</span>
        </Button>
      </div>
      
      <Card className="w-full max-w-lg glass-light neon-shadow relative z-10" data-testid="register-card">
        <CardHeader className="text-center space-y-4 pb-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative float">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl blur-xl opacity-40"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-cyan-600 p-4 rounded-2xl shadow-xl">
                <Building2 size={48} className="text-white" />
              </div>
              <Sparkles size={18} className="absolute -top-2 -end-2 text-emerald-400" />
            </div>
          </div>
          
          {/* Brand */}
          <div>
            <h1 className="font-heading font-bold text-4xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 uppercase tracking-tight">
              {language === 'fr' ? 'Inscription Locateur' : 'تسجيل المؤجر'}
            </h1>
            <p className="text-slate-600 text-sm mt-2">
              {language === 'fr' ? 'Créez votre compte entreprise sur LocaTrack' : 'أنشئ حساب شركتك على LocaTrack'}
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">
                🏢 {language === 'fr' ? 'Nom de l\'entreprise' : 'اسم الشركة'} *
              </Label>
              <Input
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                placeholder={language === 'fr' ? 'Ex: Location Auto Alger' : 'مثال: تأجير سيارات الجزائر'}
                className="h-12 bg-white border-2 border-slate-300 focus:border-emerald-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">
                👤 {language === 'fr' ? 'Votre nom complet' : 'اسمك الكامل'} *
              </Label>
              <Input
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder={language === 'fr' ? 'Prénom et Nom' : 'الاسم الأول والأخير'}
                className="h-12 bg-white border-2 border-slate-300 focus:border-emerald-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">
                  ✉️ Email *
                </Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemple.com"
                  className="h-12 bg-white border-2 border-slate-300 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">
                  📱 {language === 'fr' ? 'Téléphone' : 'الهاتف'}
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+213 5XX XXX XXX"
                  className="h-12 bg-white border-2 border-slate-300 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">
                  🔒 {language === 'fr' ? 'Mot de passe' : 'كلمة المرور'} *
                </Label>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="h-12 bg-white border-2 border-slate-300 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">
                  🔒 {language === 'fr' ? 'Confirmer' : 'تأكيد'} *
                </Label>
                <Input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="h-12 bg-white border-2 border-slate-300 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold text-lg shadow-lg hover:shadow-xl group mt-4"
              disabled={loading}
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (language === 'fr' ? 'Création...' : 'جاري الإنشاء...') : (language === 'fr' ? 'Créer mon compte' : 'إنشاء حسابي')}
                {!loading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
              </span>
            </Button>
          </form>
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 mb-2">
              {language === 'fr' ? 'Vous avez déjà un compte ?' : 'هل لديك حساب بالفعل؟'}
            </p>
            <Link to="/login">
              <Button variant="ghost" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                <ArrowLeft size={18} className="me-2" />
                {language === 'fr' ? 'Se connecter' : 'تسجيل الدخول'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
