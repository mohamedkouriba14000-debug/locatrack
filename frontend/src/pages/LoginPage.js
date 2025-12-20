import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Languages, ArrowRight, Car, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';

const LoginPage = () => {
  const { login } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const handlePlaySound = (type) => {
    if (soundEnabled) {
      playSyntheticSound(type);
    }
  };
  
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
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleLanguageToggle = () => {
    handlePlaySound('click');
    toggleLanguage();
  };
  
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      playSyntheticSound('notification');
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex items-center justify-center p-4 relative overflow-hidden" data-testid="login-page">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 start-20 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 end-20 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 start-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/3 end-1/3 w-2 h-2 bg-violet-400 rounded-full animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 start-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{animationDuration: '5s', animationDelay: '2s'}}></div>
      </div>
      
      {/* Top controls */}
      <div className="absolute top-4 end-4 z-10 flex gap-2">
        <Button
          onClick={toggleSound}
          variant="outline"
          size="sm"
          className="glass border-slate-700 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 font-medium"
          data-testid="sound-toggle-btn"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </Button>
        <Button
          onClick={handleLanguageToggle}
          variant="outline"
          size="sm"
          data-testid="language-toggle-btn"
          className="glass border-slate-700 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 font-medium"
        >
          <Languages size={18} className="me-2" />
          {language === 'fr' ? 'العربية' : 'Français'}
        </Button>
      </div>
      
      <Card className="w-full max-w-md glass border-slate-800/50 relative z-10 shadow-2xl" data-testid="login-card">
        <CardHeader className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-cyan-500 to-violet-600 p-4 rounded-2xl">
                <Car size={48} className="text-white" />
              </div>
            </div>
          </div>
          
          {/* Brand Name */}
          <div>
            <h1 className="font-heading font-bold text-5xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 uppercase tracking-tight animate-pulse" style={{animationDuration: '3s'}}>
              LocaTrack
            </h1>
            <div className="h-1 w-40 mx-auto mt-3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"></div>
            <p className="text-slate-300 text-sm mt-3 tracking-wide font-medium">
              {language === 'fr' ? 'Gestion Intelligente de Flotte' : 'إدارة ذكية للأسطول'}
            </p>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-slate-100 font-heading" data-testid="login-title">{t('login')}</CardTitle>
            <CardDescription className="text-slate-400 mt-2" data-testid="login-description">
              {language === 'fr' 
                ? 'Connectez-vous à votre espace' 
                : 'سجّل الدخول إلى حسابك'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-100 font-semibold text-sm" data-testid="email-label">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onFocus={() => handlePlaySound('click')}
                data-testid="email-input"
                placeholder={language === 'fr' ? 'votre@email.com' : 'البريد الإلكتروني'}
                className="h-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-100 font-semibold text-sm" data-testid="password-label">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                onFocus={() => handlePlaySound('click')}
                data-testid="password-input"
                placeholder="••••••••"
                className="h-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 font-bold text-lg neon-border group relative overflow-hidden"
              disabled={loading}
              data-testid="login-submit-button"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? t('loading') : t('login')}
                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
          </form>
          
          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
            <p className="text-xs text-slate-300 text-center mb-2 font-semibold">
              {language === 'fr' ? 'Comptes de test' : 'حسابات تجريبية'}
            </p>
            <div className="space-y-1 text-xs text-slate-400">
              <p><span className="text-cyan-400 font-bold">Admin:</span> admin@vehicletrack.dz / admin123</p>
              <p><span className="text-violet-400 font-bold">Employé:</span> employee@vehicletrack.dz / employee123</p>
              <p><span className="text-emerald-400 font-bold">Client:</span> client@vehicletrack.dz / client123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;