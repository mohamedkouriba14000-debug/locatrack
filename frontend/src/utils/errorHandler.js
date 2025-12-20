// Utility pour formater les erreurs API
export const formatApiError = (error) => {
  if (!error.response) {
    return 'Erreur de connexion au serveur';
  }
  
  const detail = error.response?.data?.detail;
  
  // Si detail est un string, le retourner
  if (typeof detail === 'string') {
    return detail;
  }
  
  // Si detail est un array (erreurs de validation Pydantic)
  if (Array.isArray(detail)) {
    return detail.map(err => {
      const field = err.loc ? err.loc.join('.') : 'Champ';
      const msg = err.msg || 'Erreur de validation';
      return `${field}: ${msg}`;
    }).join(', ');
  }
  
  // Si detail est un objet
  if (typeof detail === 'object' && detail !== null) {
    if (detail.msg) return detail.msg;
    return JSON.stringify(detail);
  }
  
  // Fallback
  return error.message || 'Une erreur est survenue';
};

export default formatApiError;