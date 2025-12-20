import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Languages, ArrowRight, Car, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';

const LoginPage = () => {
  const { login } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const handlePlaySound = (type) => soundEnabled && playSyntheticSound(type);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    handlePlaySound('click');
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      handlePlaySound('success');
      toast.success(t('success'));
      setTimeout(() => navigate('/dashboard'), 300);
    } else {
      handlePlaySound('error');
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
          onClick={() => { setSoundEnabled(!soundEnabled); !soundEnabled && playSyntheticSound('notification'); }}
          variant="outline"
          size="sm"
          className="glass-light hover:neon-shadow"
          data-testid="sound-toggle-btn"
        >
          {soundEnabled ? <Volume2 size={18} className="text-cyan-600" /> : <VolumeX size={18} className="text-slate-400" />}
        </Button>
        <Button
          onClick={() => { handlePlaySound('click'); toggleLanguage(); }}
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
        <CardHeader className="text-center space-y-6 pb-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative float">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-2xl blur-xl opacity-40"></div>
              <div className="relative bg-gradient-to-br from-cyan-500 to-violet-600 p-5 rounded-2xl shadow-xl">
                <Car size={56} className="text-white" />
              </div>
              <Sparkles size={20} className="absolute -top-2 -end-2 text-yellow-400" />
            </div>
          </div>
          
          {/* Brand */}
          <div>
            <h1 className="font-heading font-bold text-6xl text-transparent bg-clip-text animated-gradient uppercase tracking-tight">
              LocaTrack
            </h1>
            <div className="h-1.5 w-48 mx-auto mt-4 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 rounded-full"></div>
            <p className="text-slate-600 text-sm mt-4 tracking-wide font-medium">
              {language === 'fr' ? 'Gestion Intelligente de Flotte' : 'إدارة ذكية للأسطول'}
            </p>
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold text-slate-800 font-heading" data-testid="login-title">
              {t('login')}
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2 text-base" data-testid="login-description">
              {language === 'fr' ? 'Connectez-vous à votre espace' : 'سجّل الدخول إلى حسابك'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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
                onFocus={() => handlePlaySound('click')}
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
                onFocus={() => handlePlaySound('click')}
                data-testid="password-input"
                placeholder="••••••••"
                className="h-12 bg-white border-2 border-slate-300 focus:border-violet-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-13 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-bold text-lg shadow-lg hover:shadow-xl group"
              disabled={loading}
              data-testid="login-submit-button"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? t('loading') : t('login')}
                {!loading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
              </span>
            </Button>
          </form>
          
          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl">
            <p className="text-xs text-slate-600 text-center mb-3 font-bold uppercase tracking-wide">
              {language === 'fr' ? '🔑 Comptes de test' : '🔑 حسابات تجريبية'}
            </p>
            <div className="space-y-2 text-xs">
              <p className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-cyan-600 font-bold">Admin:</span>
                <span className="text-slate-600">admin@vehicletrack.dz</span>
              </p>
              <p className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-violet-600 font-bold">Employé:</span>
                <span className="text-slate-600">employee@vehicletrack.dz</span>
              </p>
              <p className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-emerald-600 font-bold">Client:</span>
                <span className="text-slate-600">client@vehicletrack.dz</span>
              </p>
              <p className="text-center text-slate-500 mt-2 italic">Mot de passe: [role]123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;