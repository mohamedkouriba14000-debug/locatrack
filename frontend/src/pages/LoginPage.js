import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { login } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success(t('success'));
      navigate('/dashboard');
    } else {
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
  
  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex items-center justify-center p-4 relative overflow-hidden" data-testid="login-page">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 start-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 end-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="absolute top-4 end-4 z-10">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          data-testid="language-toggle-btn"
          className="glass border-slate-700 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10"
        >
          <Languages size={18} className="me-2" />
          {language === 'fr' ? 'العربية' : 'Français'}
        </Button>
      </div>
      
      <Card className="w-full max-w-md glass border-slate-800/50 relative z-10" data-testid="login-card">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="font-heading font-bold text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 uppercase tracking-tight">
              VehicleTrack Pro
            </h1>
            <div className="h-1 w-32 mx-auto mt-2 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full"></div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-100 font-heading" data-testid="login-title">{t('login')}</CardTitle>
          <CardDescription className="text-slate-400" data-testid="login-description">
            {language === 'fr' 
              ? 'Connectez-vous à votre compte' 
              : 'سجّل الدخول إلى حسابك'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300" data-testid="email-label">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                data-testid="email-input"
                className="h-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-slate-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300" data-testid="password-label">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                data-testid="password-input"
                className="h-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-slate-100"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 font-bold neon-border"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? t('loading') : t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;