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
    <div className="min-h-screen relative overflow-hidden" data-testid="login-page">
      {/* Animated City Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 40}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}
        </div>
        
        {/* City Skyline */}
        <div className="absolute bottom-0 left-0 right-0 h-64">
          {/* Buildings */}
          <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1920 256" preserveAspectRatio="none">
            <defs>
              <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            
            {/* Building silhouettes */}
            <rect x="50" y="80" width="80" height="176" fill="url(#buildingGradient)" />
            <rect x="140" y="120" width="60" height="136" fill="url(#buildingGradient)" />
            <rect x="210" y="60" width="100" height="196" fill="url(#buildingGradient)" />
            <rect x="320" y="100" width="70" height="156" fill="url(#buildingGradient)" />
            <rect x="400" y="40" width="120" height="216" fill="url(#buildingGradient)" />
            <rect x="530" y="90" width="80" height="166" fill="url(#buildingGradient)" />
            <rect x="620" y="130" width="50" height="126" fill="url(#buildingGradient)" />
            <rect x="680" y="70" width="90" height="186" fill="url(#buildingGradient)" />
            <rect x="780" y="110" width="70" height="146" fill="url(#buildingGradient)" />
            <rect x="860" y="50" width="110" height="206" fill="url(#buildingGradient)" />
            <rect x="980" y="85" width="80" height="171" fill="url(#buildingGradient)" />
            <rect x="1070" y="120" width="60" height="136" fill="url(#buildingGradient)" />
            <rect x="1140" y="55" width="100" height="201" fill="url(#buildingGradient)" />
            <rect x="1250" y="95" width="75" height="161" fill="url(#buildingGradient)" />
            <rect x="1335" y="45" width="115" height="211" fill="url(#buildingGradient)" />
            <rect x="1460" y="100" width="85" height="156" fill="url(#buildingGradient)" />
            <rect x="1555" y="75" width="95" height="181" fill="url(#buildingGradient)" />
            <rect x="1660" y="115" width="70" height="141" fill="url(#buildingGradient)" />
            <rect x="1740" y="65" width="100" height="191" fill="url(#buildingGradient)" />
            <rect x="1850" y="105" width="70" height="151" fill="url(#buildingGradient)" />
            
            {/* Windows with lights */}
            {[50, 210, 400, 680, 860, 1140, 1335, 1555, 1740].map((x, bi) => (
              [...Array(8)].map((_, i) => (
                [...Array(3)].map((_, j) => (
                  <rect 
                    key={`window-${bi}-${i}-${j}`}
                    x={x + 10 + j * 25} 
                    y={100 + i * 18} 
                    width="12" 
                    height="10" 
                    fill={Math.random() > 0.4 ? "url(#windowGlow)" : "#1e293b"}
                    opacity={Math.random() > 0.3 ? 0.9 : 0.3}
                    className="animate-pulse"
                    style={{ animationDelay: `${Math.random() * 5}s` }}
                  />
                ))
              ))
            ))}
          </svg>
          
          {/* Road */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-800">
            {/* Road markings */}
            <div className="absolute top-1/2 left-0 right-0 h-1 flex items-center">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-16 bg-yellow-400 mx-8 animate-road-marking"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Animated Cars */}
        <div className="absolute bottom-4 left-0 right-0">
          {/* Car 1 - Moving right */}
          <div className="absolute animate-car-right" style={{ animationDuration: '12s' }}>
            <svg width="120" height="50" viewBox="0 0 120 50">
              <rect x="10" y="20" width="80" height="20" rx="5" fill="#ef4444" />
              <rect x="25" y="10" width="40" height="15" rx="3" fill="#ef4444" />
              <rect x="30" y="12" width="15" height="10" rx="2" fill="#60a5fa" opacity="0.8" />
              <rect x="48" y="12" width="15" height="10" rx="2" fill="#60a5fa" opacity="0.8" />
              <circle cx="25" cy="42" r="8" fill="#1f2937" />
              <circle cx="25" cy="42" r="4" fill="#6b7280" />
              <circle cx="75" cy="42" r="8" fill="#1f2937" />
              <circle cx="75" cy="42" r="4" fill="#6b7280" />
              <rect x="85" y="25" width="8" height="6" rx="1" fill="#fbbf24" className="animate-pulse" />
              <rect x="5" y="25" width="8" height="6" rx="1" fill="#ef4444" />
            </svg>
          </div>
          
          {/* Car 2 - Moving right faster */}
          <div className="absolute animate-car-right" style={{ animationDuration: '8s', animationDelay: '3s' }}>
            <svg width="100" height="45" viewBox="0 0 100 45">
              <rect x="10" y="18" width="65" height="18" rx="4" fill="#3b82f6" />
              <rect x="22" y="8" width="35" height="14" rx="3" fill="#3b82f6" />
              <rect x="26" y="10" width="12" height="9" rx="2" fill="#60a5fa" opacity="0.8" />
              <rect x="42" y="10" width="12" height="9" rx="2" fill="#60a5fa" opacity="0.8" />
              <circle cx="22" cy="38" r="7" fill="#1f2937" />
              <circle cx="22" cy="38" r="3" fill="#6b7280" />
              <circle cx="62" cy="38" r="7" fill="#1f2937" />
              <circle cx="62" cy="38" r="3" fill="#6b7280" />
              <rect x="72" y="22" width="6" height="5" rx="1" fill="#fbbf24" className="animate-pulse" />
            </svg>
          </div>
          
          {/* Car 3 - Moving left (opposite lane) */}
          <div className="absolute animate-car-left bottom-2" style={{ animationDuration: '10s', animationDelay: '1s' }}>
            <svg width="110" height="48" viewBox="0 0 110 48" style={{ transform: 'scaleX(-1)' }}>
              <rect x="10" y="18" width="75" height="20" rx="5" fill="#10b981" />
              <rect x="20" y="8" width="45" height="14" rx="3" fill="#10b981" />
              <rect x="25" y="10" width="15" height="10" rx="2" fill="#60a5fa" opacity="0.8" />
              <rect x="44" y="10" width="15" height="10" rx="2" fill="#60a5fa" opacity="0.8" />
              <circle cx="25" cy="40" r="8" fill="#1f2937" />
              <circle cx="25" cy="40" r="4" fill="#6b7280" />
              <circle cx="70" cy="40" r="8" fill="#1f2937" />
              <circle cx="70" cy="40" r="4" fill="#6b7280" />
              <rect x="82" y="23" width="7" height="5" rx="1" fill="#fbbf24" className="animate-pulse" />
            </svg>
          </div>
          
          {/* Car 4 - SUV Moving right */}
          <div className="absolute animate-car-right" style={{ animationDuration: '15s', animationDelay: '6s' }}>
            <svg width="140" height="55" viewBox="0 0 140 55">
              <rect x="10" y="15" width="100" height="28" rx="5" fill="#8b5cf6" />
              <rect x="20" y="5" width="70" height="15" rx="4" fill="#8b5cf6" />
              <rect x="25" y="7" width="18" height="11" rx="2" fill="#60a5fa" opacity="0.8" />
              <rect x="47" y="7" width="18" height="11" rx="2" fill="#60a5fa" opacity="0.8" />
              <rect x="69" y="7" width="18" height="11" rx="2" fill="#60a5fa" opacity="0.8" />
              <circle cx="30" cy="47" r="9" fill="#1f2937" />
              <circle cx="30" cy="47" r="5" fill="#6b7280" />
              <circle cx="95" cy="47" r="9" fill="#1f2937" />
              <circle cx="95" cy="47" r="5" fill="#6b7280" />
              <rect x="107" y="23" width="8" height="6" rx="1" fill="#fbbf24" className="animate-pulse" />
            </svg>
          </div>
        </div>
        
        {/* Street lights */}
        {[150, 450, 750, 1050, 1350, 1650].map((x, i) => (
          <div key={i} className="absolute bottom-16" style={{ left: x }}>
            <div className="w-2 h-24 bg-slate-600 rounded-t-full" />
            <div className="w-8 h-3 bg-slate-500 rounded -mt-1 -ml-3" />
            <div className="w-4 h-4 bg-yellow-300 rounded-full -mt-1 ml-0 animate-pulse opacity-80 shadow-lg shadow-yellow-300/50" />
          </div>
        ))}
      </div>
      
      {/* Top controls */}
      <div className="absolute top-6 end-6 z-10 flex gap-2">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white"
          data-testid="language-toggle-btn"
        >
          <Languages size={18} className="me-2" />
          <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
        </Button>
      </div>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl border-0" data-testid="login-card">
          <CardHeader className="text-center space-y-6 pb-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Car className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            
            <div>
              <CardTitle className="font-heading font-black text-3xl bg-gradient-to-r from-cyan-600 to-blue-600 text-transparent bg-clip-text">
                LocaTrack
              </CardTitle>
              <CardDescription className="text-slate-500 mt-2">
                {language === 'fr' ? 'Plateforme de gestion de location de véhicules' : 'منصة إدارة تأجير السيارات'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{t('email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="exemple@email.com"
                  className="h-12 bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:bg-white transition-all"
                  data-testid="email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{t('password')}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="••••••••"
                  className="h-12 bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:bg-white transition-all"
                  data-testid="password-input"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg shadow-lg shadow-cyan-500/30 transition-all"
                data-testid="login-btn"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('login')}
                    <ArrowRight className="ms-2" size={20} />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-600 mb-3">
                {language === 'fr' ? "Vous n'avez pas de compte ?" : "ليس لديك حساب؟"}
              </p>
              <Link to="/register">
                <Button variant="outline" className="w-full h-11 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 font-medium">
                  <UserPlus size={18} className="me-2" />
                  {language === 'fr' ? "Créer un compte" : "إنشاء حساب"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes car-right {
          0% { transform: translateX(-200px); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        @keyframes car-left {
          0% { transform: translateX(calc(100vw + 200px)); }
          100% { transform: translateX(-200px); }
        }
        @keyframes road-marking {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .animate-car-right {
          animation: car-right linear infinite;
        }
        .animate-car-left {
          animation: car-left linear infinite;
        }
        .animate-road-marking {
          animation: road-marking 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
