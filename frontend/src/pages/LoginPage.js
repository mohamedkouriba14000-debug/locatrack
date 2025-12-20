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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" data-testid="login-page">
      <div className="absolute top-4 end-4">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          data-testid="language-toggle-btn"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Languages size={18} className="me-2" />
          {language === 'fr' ? 'العربية' : 'Français'}
        </Button>
      </div>
      
      <Card className="w-full max-w-md" data-testid="login-card">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="font-heading font-black text-3xl text-amber-500 uppercase tracking-tight">
              VehicleTrack Pro
            </h1>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="login-title">{t('login')}</CardTitle>
          <CardDescription data-testid="login-description">
            {language === 'fr' 
              ? 'Connectez-vous à votre compte' 
              : 'سجّل الدخول إلى حسابك'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" data-testid="email-label">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                data-testid="email-input"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="password-label">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                data-testid="password-input"
                className="h-12"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold"
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