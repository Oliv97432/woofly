import { useState, useEffect } from 'react';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Search, Filter, MapPin, Star, Navigation } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '600px'
};

const center = {
  lat: 48.8566,
  lng: 2.3522
};

const ServicesPage = () => {
  const [map, setMap] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const libraries = ['places'];

  const searchNearby = () => {
    if (!map) return;

    const service = new window.google.maps.places.PlacesService(map);
    
    const request = {
      location: userLocation || center,
      radius: 5000,
      type: 'veterinary_care',
      keyword: 'chien'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === 'OK') {
        setPlaces(results || []);
      }
    });
  };

  const getDirections = (place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Services Canins près de chez vous</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Filtres et recherche */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Vétérinaire, toiletteur, promeneur..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="mt-4">
                <h3 className="font-bold mb-2">Filtrer par type</h3>
                <div className="space-y-2">
                  {['Vétérinaires', 'Toiletteurs', 'Animaleries', 'Parcs'].map(type => (
                    <button
                      key={type}
                      className="flex items-center p-3 w-full text-left hover:bg-gray-50 rounded-lg"
                    >
                      <Filter size={18} className="mr-3" />
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Résultats liste */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <h3 className="p-4 font-bold border-b">Résultats ({places.length})</h3>
              <div className="max-h-96 overflow-y-auto">
                {places.map(place => (
                  <div
                    key={place.place_id}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedPlace(place)}
                  >
                    <h4 className="font-bold">{place.name}</h4>
                    <p className="text-gray-600 text-sm">{place.vicinity}</p>
                    {place.rating && (
                      <div className="flex items-center mt-2">
                        <Star size={14} className="text-yellow-400 fill-current mr-1" />
                        <span className="text-sm">{place.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Carte */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <LoadScript
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
              >
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={userLocation || center}
                  zoom={12}
                  onLoad={setMap}
                  options={{
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false
                  }}
                >
                  {places.map(place => (
                    <Marker
                      key={place.place_id}
                      position={place.geometry.location}
                      onClick={() => setSelectedPlace(place)}
                    />
                  ))}
                  
                  {selectedPlace && (
                    <InfoWindow
                      position={selectedPlace.geometry.location}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div className="p-2 max-w-xs">
                        <h3 className="font-bold mb-1">{selectedPlace.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{selectedPlace.vicinity}</p>
                        <button
                          onClick={() => getDirections(selectedPlace)}
                          className="flex items-center text-blue-600 font-semibold"
                        >
                          <Navigation size={16} className="mr-1" />
                          Itinéraire
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
