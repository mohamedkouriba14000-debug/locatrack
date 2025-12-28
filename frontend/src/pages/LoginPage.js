import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Languages, ArrowRight, Car, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { login } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success(language === 'fr' ? 'Connexion réussie' : 'تم تسجيل الدخول بنجاح');
      setTimeout(() => navigate('/dashboard'), 300);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden" data-testid="login-page">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 start-20 w-64 h-64 bg-cyan-200/40 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 end-20 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 start-1/2 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Top controls */}
      <div className="absolute top-6 end-6 z-10 flex gap-2">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="glass-light hover:neon-shadow"
          data-testid="language-toggle-btn"
        >
          <Languages size={18} className="me-2 text-violet-600" />
          <span className="text-slate-700 font-medium">{language === 'fr' ? 'العربية' : 'Français'}</span>
        </Button>
      </div>
      
      <Card className="w-full max-w-md glass-light neon-shadow relative z-10" data-testid="login-card">
        <CardHeader className="text-center space-y-6 pb-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative float">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-2xl blur-xl opacity-40"></div>
              <div className="relative bg-gradient-to-br from-cyan-500 to-violet-600 p-5 rounded-2xl shadow-xl">
                <Car size={56} className="text-white" />
              </div>
              <Sparkles size={20} className="absolute -top-2 -end-2 text-cyan-400" />
            </div>
          </div>
          
          {/* Brand */}
          <div>
            <h1 className="font-heading font-bold text-5xl text-transparent bg-clip-text animated-gradient uppercase tracking-tight">
              LocaTrack
            </h1>
            <div className="h-1.5 w-48 mx-auto mt-4 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 rounded-full"></div>
            <p className="text-slate-600 text-sm mt-4 tracking-wide font-medium">
              {language === 'fr' ? 'Plateforme SaaS de Gestion de Location' : 'منصة إدارة تأجير السيارات'}
            </p>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800 font-heading" data-testid="login-title">
              {t('login')}
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2" data-testid="login-description">
              {language === 'fr' ? 'Connectez-vous à votre espace' : 'سجّل الدخول إلى حسابك'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold" data-testid="email-label">
                {t('email')}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="email-input"
                placeholder={language === 'fr' ? 'votre@email.com' : 'البريد الإلكتروني'}
                className="h-12 bg-white border-2 border-slate-300 focus:border-cyan-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold" data-testid="password-label">
                {t('password')}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                data-testid="password-input"
                placeholder="••••••••"
                className="h-12 bg-white border-2 border-slate-300 focus:border-violet-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-bold text-lg shadow-lg hover:shadow-xl group"
              disabled={loading}
              data-testid="login-submit-button"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? t('loading') : t('login')}
                {!loading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
              </span>
            </Button>
          </form>
          
          {/* Register Link */}
          <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-200 rounded-xl text-center">
            <p className="text-slate-600 mb-3">
              {language === 'fr' ? 'Vous êtes propriétaire d\'une entreprise de location ?' : 'هل أنت صاحب شركة تأجير؟'}
            </p>
            <Link to="/register">
              <Button
                variant="outline"
                className="border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 font-bold"
                data-testid="register-link"
              >
                <UserPlus size={20} className="me-2" />
                {language === 'fr' ? 'Créer un compte Locateur' : 'إنشاء حساب مؤجر'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
