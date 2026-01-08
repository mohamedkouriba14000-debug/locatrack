import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Car, Navigation, RefreshCw, Satellite, Clock, Gauge, Battery, Signal, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
const createCarIcon = (status, isMoving = false) => {
  const colors = {
    available: '#10B981', // green
    rented: '#3B82F6', // blue
    maintenance: '#F59E0B', // yellow
    offline: '#6B7280', // gray
  };
  const color = colors[status] || colors.available;
  
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <div style="
          background: ${color};
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
          ${isMoving ? 'animation: pulse 1.5s infinite;' : ''}
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        ${isMoving ? `
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #EF4444;
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: bold;
        ">LIVE</div>
        ` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Component to handle map center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const GPSTrackingPage = () => {
  const { getAuthHeaders } = useAuth();
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [gpsData, setGpsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mapCenter, setMapCenter] = useState([36.7538, 3.0588]); // Alger par défaut
  const [mapZoom, setMapZoom] = useState(12);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const refreshIntervalRef = useRef(null);
  
  useEffect(() => {
    fetchVehicles();
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchGPSData();
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
  
  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`, { headers: getAuthHeaders() });
      setVehicles(response.data);
      // Generate simulated GPS data for demo
      generateSimulatedGPSData(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchGPSData = async () => {
    // In real implementation, this would call the GPS API
    // For now, we simulate GPS movement
    setGpsData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(vehicleId => {
        if (newData[vehicleId].isMoving) {
          // Simulate small movement
          newData[vehicleId] = {
            ...newData[vehicleId],
            lat: newData[vehicleId].lat + (Math.random() - 0.5) * 0.001,
            lng: newData[vehicleId].lng + (Math.random() - 0.5) * 0.001,
            speed: Math.floor(Math.random() * 80) + 20,
            lastUpdate: new Date().toISOString(),
          };
        }
      });
      return newData;
    });
  };
  
  const generateSimulatedGPSData = (vehiclesList) => {
    // Generate realistic GPS positions around Algiers
    const basePositions = [
      { lat: 36.7538, lng: 3.0588, area: 'Centre Alger' },
      { lat: 36.7650, lng: 3.0420, area: 'Bab El Oued' },
      { lat: 36.7320, lng: 3.0870, area: 'Hussein Dey' },
      { lat: 36.7450, lng: 3.1200, area: 'El Harrach' },
      { lat: 36.7800, lng: 3.0650, area: 'Casbah' },
      { lat: 36.7100, lng: 3.1800, area: 'Rouiba' },
      { lat: 36.7600, lng: 2.9800, area: 'Chéraga' },
      { lat: 36.7250, lng: 3.0100, area: 'Hydra' },
    ];
    
    const newGpsData = {};
    vehiclesList.forEach((vehicle, index) => {
      const pos = basePositions[index % basePositions.length];
      const isMoving = vehicle.status === 'rented';
      newGpsData[vehicle.id] = {
        lat: pos.lat + (Math.random() - 0.5) * 0.02,
        lng: pos.lng + (Math.random() - 0.5) * 0.02,
        area: pos.area,
        speed: isMoving ? Math.floor(Math.random() * 60) + 20 : 0,
        heading: Math.floor(Math.random() * 360),
        battery: Math.floor(Math.random() * 40) + 60,
        signal: Math.floor(Math.random() * 30) + 70,
        isMoving: isMoving,
        lastUpdate: new Date().toISOString(),
        ignition: isMoving,
      };
    });
    setGpsData(newGpsData);
  };
  
  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    const gps = gpsData[vehicle.id];
    if (gps) {
      setMapCenter([gps.lat, gps.lng]);
      setMapZoom(16);
    }
  };
  
  const centerOnVehicle = (vehicle) => {
    const gps = gpsData[vehicle.id];
    if (gps) {
      setMapCenter([gps.lat, gps.lng]);
      setMapZoom(17);
    }
  };
  
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">{language === 'fr' ? 'Chargement des données GPS...' : 'جاري تحميل بيانات GPS...'}</p>
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
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-xl">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Satellite size={20} />
                {language === 'fr' ? 'Suivi GPS' : 'تتبع GPS'}
              </h2>
              <p className="text-cyan-100 text-sm">{filteredVehicles.length} {language === 'fr' ? 'véhicules' : 'مركبات'}</p>
            </div>
            
            {/* Search & Filter */}
            <div className="p-3 space-y-2 border-b border-slate-200">
              <div className="relative">
                <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher...' : 'بحث...'}
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
                  <SelectItem value="available">{language === 'fr' ? 'Disponible' : 'متاح'}</SelectItem>
                  <SelectItem value="rented">{language === 'fr' ? 'En location' : 'مؤجر'}</SelectItem>
                  <SelectItem value="maintenance">{language === 'fr' ? 'Maintenance' : 'صيانة'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Vehicle List */}
            <div className="flex-1 overflow-y-auto">
              {filteredVehicles.map(vehicle => {
                const gps = gpsData[vehicle.id];
                const isSelected = selectedVehicle?.id === vehicle.id;
                
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => handleVehicleClick(vehicle)}
                    className={`p-3 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${isSelected ? 'bg-cyan-50 border-s-4 border-s-cyan-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${gps?.isMoving ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <p className="font-semibold text-slate-800 text-sm">{vehicle.make} {vehicle.model}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{vehicle.registration_number}</p>
                        {gps && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <MapPin size={12} className="text-cyan-500" />
                              <span>{gps.area}</span>
                            </div>
                            {gps.isMoving && (
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Gauge size={12} className="text-blue-500" />
                                <span>{gps.speed} km/h</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                          vehicle.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {vehicle.status === 'available' ? (language === 'fr' ? 'Dispo' : 'متاح') :
                           vehicle.status === 'rented' ? (language === 'fr' ? 'Loué' : 'مؤجر') :
                           (language === 'fr' ? 'Maint.' : 'صيانة')}
                        </span>
                        {gps && (
                          <div className="flex items-center gap-1">
                            <Battery size={10} className="text-slate-400" />
                            <span className="text-xs text-slate-500">{gps.battery}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Auto-refresh toggle */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <RefreshCw size={12} className={autoRefresh ? 'animate-spin text-cyan-500' : 'text-slate-400'} />
                  {language === 'fr' ? 'Auto-refresh' : 'تحديث تلقائي'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`text-xs ${autoRefresh ? 'text-cyan-600' : 'text-slate-400'}`}
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
          {/* Map Header */}
          <div className="absolute top-4 start-4 end-4 z-[1000] flex justify-between items-center">
            <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-slate-600">{language === 'fr' ? 'Disponible' : 'متاح'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-600">{language === 'fr' ? 'En location' : 'مؤجر'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-slate-600">{language === 'fr' ? 'Maintenance' : 'صيانة'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setMapCenter([36.7538, 3.0588]); setMapZoom(12); }}
                  className="text-xs"
                >
                  <Navigation size={14} className="me-1" />
                  {language === 'fr' ? 'Recentrer' : 'إعادة التمركز'}
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
              
              {filteredVehicles.map(vehicle => {
                const gps = gpsData[vehicle.id];
                if (!gps) return null;
                
                return (
                  <Marker
                    key={vehicle.id}
                    position={[gps.lat, gps.lng]}
                    icon={createCarIcon(vehicle.status, gps.isMoving)}
                    eventHandlers={{
                      click: () => setSelectedVehicle(vehicle),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-bold text-lg text-slate-800 mb-2">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Immatriculation' : 'رقم التسجيل'}:</span>
                            <span className="font-medium">{vehicle.registration_number}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Zone' : 'المنطقة'}:</span>
                            <span className="font-medium">{gps.area}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Vitesse' : 'السرعة'}:</span>
                            <span className="font-medium">{gps.speed} km/h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Batterie GPS' : 'بطارية GPS'}:</span>
                            <span className="font-medium">{gps.battery}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Signal' : 'الإشارة'}:</span>
                            <span className="font-medium">{gps.signal}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">{language === 'fr' ? 'Contact' : 'الإشعال'}:</span>
                            <span className={`font-medium ${gps.ignition ? 'text-green-600' : 'text-red-600'}`}>
                              {gps.ignition ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center text-xs text-slate-400">
                          <Clock size={12} className="me-1" />
                          {new Date(gps.lastUpdate).toLocaleTimeString()}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Selected Vehicle Info Panel */}
          {selectedVehicle && gpsData[selectedVehicle.id] && (
            <Card className="absolute bottom-4 start-4 end-4 z-[1000] bg-white/95 backdrop-blur shadow-xl border-2 border-cyan-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      selectedVehicle.status === 'available' ? 'bg-green-100' :
                      selectedVehicle.status === 'rented' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                      <Car size={24} className={
                        selectedVehicle.status === 'available' ? 'text-green-600' :
                        selectedVehicle.status === 'rented' ? 'text-blue-600' : 'text-yellow-600'
                      } />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{selectedVehicle.make} {selectedVehicle.model}</h3>
                      <p className="text-sm text-slate-500">{selectedVehicle.registration_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-cyan-600">
                        <MapPin size={16} />
                        <span className="font-medium">{gpsData[selectedVehicle.id].area}</span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Position' : 'الموقع'}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Gauge size={16} />
                        <span className="font-bold text-xl">{gpsData[selectedVehicle.id].speed}</span>
                        <span className="text-sm">km/h</span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Vitesse' : 'السرعة'}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <Battery size={16} />
                        <span className="font-bold">{gpsData[selectedVehicle.id].battery}%</span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Batterie' : 'البطارية'}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Signal size={16} />
                        <span className="font-bold">{gpsData[selectedVehicle.id].signal}%</span>
                      </div>
                      <p className="text-xs text-slate-400">{language === 'fr' ? 'Signal' : 'الإشارة'}</p>
                    </div>
                    
                    <Button
                      onClick={() => centerOnVehicle(selectedVehicle)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      <Navigation size={16} className="me-2" />
                      {language === 'fr' ? 'Centrer' : 'تركيز'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVehicle(null)}
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
