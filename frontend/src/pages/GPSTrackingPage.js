import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Car, Navigation, RefreshCw, Satellite, Clock, Gauge, Battery, Signal, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Power, Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Fix for default marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom car icons based on status
const createCarIcon = (isMoving = false, isOnline = true) => {
  const color = !isOnline ? '#6B7280' : isMoving ? '#10B981' : '#3B82F6';
  
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px;">
        <div style="
          background: ${color};
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
          ${isMoving ? 'animation: pulse 1.5s infinite;' : ''}
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        ${isMoving ? `<div style="position: absolute; top: -6px; right: -6px; background: #10B981; color: white; font-size: 9px; padding: 2px 5px; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">LIVE</div>` : ''}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
};

// Component to handle map center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const GPSTrackingPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [gpsObjects, setGpsObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mapCenter, setMapCenter] = useState([35.2, 1.5]); // Algeria center
  const [mapZoom, setMapZoom] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const refreshIntervalRef = useRef(null);
  
  useEffect(() => {
    fetchGPSData();
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchGPSData(true);
      }, 10000); // Refresh every 10 seconds
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);
  
  const fetchGPSData = async (silent = false) => {
    try {
      const response = await axios.get(`${API}/gps/objects`, { headers: getAuthHeaders() });
      setGpsObjects(response.data);
      setLastUpdate(new Date());
      
      // Auto-center map on first load if we have data
      if (!silent && response.data.length > 0) {
        const firstObj = response.data[0];
        if (firstObj.lat && firstObj.lng) {
          setMapCenter([firstObj.lat, firstObj.lng]);
          setMapZoom(10);
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error(formatApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleObjectClick = (obj) => {
    setSelectedObject(obj);
    if (obj.lat && obj.lng) {
      setMapCenter([obj.lat, obj.lng]);
      setMapZoom(15);
    }
  };
  
  const centerOnObject = (obj) => {
    if (obj.lat && obj.lng) {
      setMapCenter([obj.lat, obj.lng]);
      setMapZoom(17);
    }
  };
  
  const getTimeSinceUpdate = (dtTracker) => {
    if (!dtTracker) return '-';
    const lastTime = new Date(dtTracker + 'Z');
    const now = new Date();
    const diffMs = now - lastTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return language === 'fr' ? 'À l\'instant' : 'الآن';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}j`;
  };
  
  const isMoving = (obj) => obj.speed > 5;
  const isOnline = (obj) => {
    if (!obj.dt_tracker) return false;
    const lastTime = new Date(obj.dt_tracker + 'Z');
    const now = new Date();
    const diffMins = (now - lastTime) / 60000;
    return diffMins < 30; // Consider online if updated in last 30 minutes
  };
  
  const filteredObjects = gpsObjects.filter(obj => {
    const matchesSearch = 
      obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.imei?.includes(searchTerm) ||
      obj.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const moving = isMoving(obj);
    const online = isOnline(obj);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'moving' && moving) ||
      (statusFilter === 'stopped' && !moving && online) ||
      (statusFilter === 'offline' && !online);
    
    return matchesSearch && matchesStatus;
  });
  
  const movingCount = gpsObjects.filter(o => isMoving(o)).length;
  const stoppedCount = gpsObjects.filter(o => !isMoving(o) && isOnline(o)).length;
  const offlineCount = gpsObjects.filter(o => !isOnline(o)).length;
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">{language === 'fr' ? 'Connexion au serveur GPS...' : 'جاري الاتصال بخادم GPS...'}</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
          border-radius: 12px;
        }
      `}</style>
      
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
          <div className="w-80 h-full flex flex-col bg-white border-2 border-slate-200 rounded-xl shadow-lg me-4">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-t-xl">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Satellite size={20} />
                {language === 'fr' ? 'Suivi GPS Temps Réel' : 'تتبع GPS في الوقت الحقيقي'}
              </h2>
              <p className="text-cyan-100 text-sm mt-1">{gpsObjects.length} {language === 'fr' ? 'trackers connectés' : 'أجهزة متصلة'}</p>
            </div>
            
            {/* Stats */}
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-lg font-bold text-green-600">{movingCount}</p>
                  <p className="text-xs text-green-700">{language === 'fr' ? 'En mouvement' : 'متحرك'}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-lg font-bold text-blue-600">{stoppedCount}</p>
                  <p className="text-xs text-blue-700">{language === 'fr' ? 'À l\'arrêt' : 'متوقف'}</p>
                </div>
                <div className="text-center p-2 bg-slate-100 rounded-lg border border-slate-200">
                  <p className="text-lg font-bold text-slate-600">{offlineCount}</p>
                  <p className="text-xs text-slate-700">{language === 'fr' ? 'Hors ligne' : 'غير متصل'}</p>
                </div>
              </div>
            </div>
            
            {/* Search & Filter */}
            <div className="p-3 space-y-2 border-b border-slate-200">
              <div className="relative">
                <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher véhicule...' : 'بحث عن مركبة...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-9 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <Filter size={14} className="me-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'fr' ? 'Tous' : 'الكل'}</SelectItem>
                  <SelectItem value="moving">{language === 'fr' ? 'En mouvement' : 'متحرك'}</SelectItem>
                  <SelectItem value="stopped">{language === 'fr' ? 'À l\'arrêt' : 'متوقف'}</SelectItem>
                  <SelectItem value="offline">{language === 'fr' ? 'Hors ligne' : 'غير متصل'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Vehicle List */}
            <div className="flex-1 overflow-y-auto">
              {filteredObjects.map(obj => {
                const moving = isMoving(obj);
                const online = isOnline(obj);
                const isSelected = selectedObject?.imei === obj.imei;
                
                return (
                  <div
                    key={obj.imei}
                    onClick={() => handleObjectClick(obj)}
                    className={`p-3 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${isSelected ? 'bg-cyan-50 border-s-4 border-s-cyan-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${moving ? 'bg-green-500 animate-pulse' : online ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                          <p className="font-semibold text-slate-800 text-sm">{obj.name || 'Sans nom'}</p>
                        </div>
                        {obj.plate_number && (
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">{obj.plate_number}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Gauge size={12} className={moving ? 'text-green-500' : 'text-slate-400'} />
                              {obj.speed.toFixed(0)} km/h
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              {getTimeSinceUpdate(obj.dt_tracker)}
                            </span>
                          </div>
                          {obj.odometer > 0 && (
                            <p className="text-xs text-slate-500">
                              🛣️ {(obj.odometer).toFixed(0)} km
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          moving ? 'bg-green-100 text-green-700' :
                          online ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {moving ? (language === 'fr' ? 'Roule' : 'متحرك') :
                           online ? (language === 'fr' ? 'Arrêt' : 'متوقف') :
                           (language === 'fr' ? 'Offline' : 'غير متصل')}
                        </span>
                        {obj.params?.acc !== undefined && (
                          <span className={`text-xs flex items-center gap-1 ${obj.params.acc === '1' ? 'text-green-600' : 'text-red-500'}`}>
                            <Power size={10} />
                            {obj.params.acc === '1' ? 'ON' : 'OFF'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredObjects.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Car size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{language === 'fr' ? 'Aucun véhicule trouvé' : 'لم يتم العثور على مركبات'}</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : '-'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchGPSData()}
                  className="text-cyan-600 h-7 px-2"
                >
                  <RefreshCw size={14} className="me-1" /> {language === 'fr' ? 'Actualiser' : 'تحديث'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <RefreshCw size={12} className={autoRefresh ? 'animate-spin text-cyan-500' : 'text-slate-400'} />
                  Auto-refresh (10s)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`text-xs h-6 ${autoRefresh ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400'}`}
                >
                  {autoRefresh ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toggle Sidebar Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute start-4 top-24 z-10 bg-white shadow-lg border border-slate-200 rounded-full p-2"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
        
        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Map Header - Legend */}
          <div className="absolute top-4 start-4 end-4 z-[1000] flex justify-between items-center">
            <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-slate-600">{language === 'fr' ? 'En mouvement' : 'متحرك'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-600">{language === 'fr' ? 'À l\'arrêt' : 'متوقف'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span className="text-xs text-slate-600">{language === 'fr' ? 'Hors ligne' : 'غير متصل'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
              <CardContent className="p-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setMapCenter([35.2, 1.5]); setMapZoom(7); }}
                  className="text-xs"
                >
                  <Navigation size={14} className="me-1" />
                  {language === 'fr' ? 'Vue Algérie' : 'عرض الجزائر'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Leaflet Map */}
          <div className="h-full rounded-xl overflow-hidden shadow-lg border-2 border-slate-200">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {filteredObjects.map(obj => {
                if (!obj.lat || !obj.lng) return null;
                const moving = isMoving(obj);
                const online = isOnline(obj);
                
                return (
                  <Marker
                    key={obj.imei}
                    position={[obj.lat, obj.lng]}
                    icon={createCarIcon(moving, online)}
                    eventHandlers={{
                      click: () => setSelectedObject(obj),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[220px]">
                        <div className="font-bold text-lg text-slate-800 mb-1 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${moving ? 'bg-green-500' : online ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                          {obj.name || 'Sans nom'}
                        </div>
                        {obj.plate_number && (
                          <p className="text-sm text-slate-500 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">{obj.plate_number}</p>
                        )}
                        <div className="space-y-1.5 text-sm border-t border-slate-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">IMEI:</span>
                            <span className="font-mono text-xs">{obj.imei}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Vitesse' : 'السرعة'}:</span>
                            <span className={`font-bold ${moving ? 'text-green-600' : 'text-slate-600'}`}>{obj.speed.toFixed(0)} km/h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Direction' : 'الاتجاه'}:</span>
                            <span className="font-medium">{obj.angle}°</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Kilométrage' : 'المسافة'}:</span>
                            <span className="font-medium">{obj.odometer.toFixed(0)} km</span>
                          </div>
                          {obj.params?.acc !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">{language === 'fr' ? 'Contact' : 'الإشعال'}:</span>
                              <span className={`font-bold ${obj.params.acc === '1' ? 'text-green-600' : 'text-red-600'}`}>
                                {obj.params.acc === '1' ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          )}
                          {obj.params?.gsmlev && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">GSM:</span>
                              <span className="font-medium">{obj.params.gsmlev}/5</span>
                            </div>
                          )}
                          {obj.params?.gpslev && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">GPS:</span>
                              <span className="font-medium">{obj.params.gpslev} sats</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center text-xs text-slate-400">
                          <Clock size={12} className="me-1" />
                          {obj.dt_tracker ? new Date(obj.dt_tracker + 'Z').toLocaleString() : '-'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Selected Vehicle Info Panel */}
          {selectedObject && (
            <Card className="absolute bottom-4 start-4 end-4 z-[1000] bg-white/95 backdrop-blur shadow-xl border-2 border-cyan-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      isMoving(selectedObject) ? 'bg-green-100' :
                      isOnline(selectedObject) ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      <Car size={28} className={
                        isMoving(selectedObject) ? 'text-green-600' :
                        isOnline(selectedObject) ? 'text-blue-600' : 'text-slate-500'
                      } />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{selectedObject.name || 'Sans nom'}</h3>
                      <p className="text-sm text-slate-500">
                        {selectedObject.plate_number || selectedObject.imei}
                        {selectedObject.model && ` • ${selectedObject.model}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`flex items-center gap-1 ${isMoving(selectedObject) ? 'text-green-600' : 'text-slate-600'}`}>
                        <Gauge size={18} />
                        <span className="font-bold text-2xl">{selectedObject.speed.toFixed(0)}</span>
                        <span className="text-sm">km/h</span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Vitesse' : 'السرعة'}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-cyan-600">
                        <MapPin size={18} />
                        <span className="font-medium text-sm">
                          {selectedObject.lat.toFixed(4)}, {selectedObject.lng.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Position' : 'الموقع'}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Navigation size={18} />
                        <span className="font-bold">{selectedObject.angle}°</span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Direction' : 'الاتجاه'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-600 font-bold">
                        {selectedObject.odometer.toFixed(0)} km
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Kilométrage' : 'المسافة'}</p>
                    </div>
                    
                    <Button
                      onClick={() => centerOnObject(selectedObject)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      <Navigation size={16} className="me-2" />
                      {language === 'fr' ? 'Centrer' : 'تركيز'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedObject(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GPSTrackingPage;
