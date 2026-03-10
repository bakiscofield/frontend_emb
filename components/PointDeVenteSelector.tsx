'use client';

import { useState, useEffect } from 'react';
import { pointsDeVenteAPI } from '@/lib/api';
import { MapPin, ExternalLink, Navigation, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface PointDeVente {
  id: number;
  name: string;
  address: string;
  google_maps_url: string | null;
}

interface PointDeVenteSelectorProps {
  onSelect: (data: {
    pointDeVenteId: number | null;
    clientLatitude: number | null;
    clientLongitude: number | null;
  }) => void;
  selectedId?: number | null;
}

export default function PointDeVenteSelector({ onSelect, selectedId }: PointDeVenteSelectorProps) {
  const [pointsDeVente, setPointsDeVente] = useState<PointDeVente[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationShared, setLocationShared] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [clientLocation, setClientLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadPointsDeVente();
  }, []);

  const loadPointsDeVente = async () => {
    try {
      const res = await pointsDeVenteAPI.getActive();
      setPointsDeVente(res.data.data);
    } catch (error) {
      console.error('Erreur chargement PdV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pdvId: number) => {
    // Toggle : désélectionner si on clique sur le même
    const newId = selectedId === pdvId ? null : pdvId;
    onSelect({
      pointDeVenteId: newId,
      clientLatitude: clientLocation?.lat || null,
      clientLongitude: clientLocation?.lng || null
    });
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setClientLocation({ lat: latitude, lng: longitude });
        setLocationShared(true);
        setSharingLocation(false);
        toast.success('Position partagée avec succès');

        // Update parent with location
        if (selectedId) {
          onSelect({
            pointDeVenteId: selectedId,
            clientLatitude: latitude,
            clientLongitude: longitude
          });
        }
      },
      (error) => {
        setSharingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Accès à la localisation refusé');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Position non disponible');
            break;
          case error.TIMEOUT:
            toast.error('Délai d\'attente dépassé');
            break;
          default:
            toast.error('Erreur de géolocalisation');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (pointsDeVente.length === 0) {
    return (
      <div className="text-center py-6">
        <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Aucun point de vente disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-[10px] sm:text-sm font-medium text-gray-200 mb-1 sm:mb-2">
        Choisissez un point de vente <span className="text-red-400">*</span>
      </label>

      {/* Share location button */}
      <button
        type="button"
        onClick={handleShareLocation}
        disabled={sharingLocation}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
          locationShared
            ? 'border-green-500/50 bg-green-900/20 text-green-400'
            : 'border-blue-500/30 bg-blue-900/20 text-blue-400 hover:border-blue-500/50'
        }`}
      >
        <Navigation className={`w-4 h-4 ${sharingLocation ? 'animate-pulse' : ''}`} />
        {sharingLocation ? 'Localisation en cours...' : locationShared ? 'Position partagée' : 'Partager ma position'}
        {locationShared && <Check className="w-4 h-4" />}
      </button>

      {/* Points de vente list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {pointsDeVente.map((pdv) => (
          <div
            key={pdv.id}
            onClick={() => handleSelect(pdv.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedId === pdv.id
                ? 'border-red-500/50 bg-red-900/20'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 flex-shrink-0 ${selectedId === pdv.id ? 'text-red-400' : 'text-gray-400'}`} />
                  <h4 className={`text-sm font-medium truncate ${selectedId === pdv.id ? 'text-white' : 'text-gray-300'}`}>
                    {pdv.name}
                  </h4>
                  {selectedId === pdv.id && (
                    <Check className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 ml-6">{pdv.address}</p>
              </div>
              {pdv.google_maps_url && (
                <a
                  href={pdv.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-teal-400 hover:text-teal-300 flex-shrink-0"
                  title="Voir sur Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
