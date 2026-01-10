import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Phone, Crown, AlertTriangle } from 'lucide-react';

const TrialBanner = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  // Only show for locateurs with trial subscription
  if (!user || user.role !== 'locateur' || user.subscription_type !== 'trial') {
    return null;
  }
  
  // Calculate days remaining
  const subscriptionEnd = user.subscription_end ? new Date(user.subscription_end) : null;
  const now = new Date();
  const daysRemaining = subscriptionEnd ? Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24)) : 15;
  
  const isExpiringSoon = daysRemaining <= 5;
  const isExpired = daysRemaining <= 0;
  
  const bannerClass = isExpired 
    ? 'from-red-500 to-red-600' 
    : isExpiringSoon 
      ? 'from-orange-500 to-orange-600' 
      : 'from-blue-500 to-blue-600';
  
  const contactNumber = '+2130555054421';
  
  return (
    <div className={`bg-gradient-to-r ${bannerClass} text-white py-3 px-4 shadow-lg`} data-testid="trial-banner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertTriangle size={24} className="text-yellow-300 animate-pulse" />
          ) : (
            <Crown size={24} className="text-yellow-300" />
          )}
          <div>
            <p className="font-bold text-sm sm:text-base">
              {isExpired 
                ? (language === 'fr' ? '⚠️ Période d\'essai expirée !' : '⚠️ انتهت فترة التجربة!')
                : (language === 'fr' 
                    ? `🎉 Bienvenue ! Vous êtes en période d'essai gratuite` 
                    : `🎉 مرحباً! أنت في فترة تجريبية مجانية`
                  )
              }
            </p>
            <p className="text-xs sm:text-sm opacity-90">
              {!isExpired && (
                <>
                  <Clock size={14} className="inline me-1" />
                  {language === 'fr' 
                    ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`
                    : `${daysRemaining} يوم متبقي`
                  }
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
          <Phone size={18} />
          <div className="text-start">
            <p className="text-xs opacity-90">
              {language === 'fr' ? 'Contactez-nous pour la version complète' : 'اتصل بنا للحصول على النسخة الكاملة'}
            </p>
            <a 
              href={`tel:${contactNumber}`} 
              className="font-bold text-sm sm:text-base hover:underline"
              data-testid="contact-phone"
            >
              {contactNumber}
            </a>
            <p className="text-xs opacity-80">
              {language === 'fr' ? 'Abonnement 1 an ou illimité' : 'اشتراك سنة أو غير محدود'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
