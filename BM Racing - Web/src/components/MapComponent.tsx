import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { toast } from 'react-toastify';

const LocationSearch = () => {
    const [query, setQuery] = useState('');
    const map = useMap();
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query) return;

        setLoading(true);

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
            const results = await response.json();

            if (results.length > 0) {
                const { lat, lon } = results[0];
                map.setView([parseFloat(lat), parseFloat(lon)], 13);
            } else {
                toast.error('Lokace nebyla nalezena');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='absolute top-3 right-3 z-1000 flex items-center'>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Vyhledat lokaci..."
                    className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-8 focus:outline-none focus:border focus:border-gray-300 bg-white"
                />
                {loading && (
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <div className="spinner border-t-2 border-b-2 border-gray-900 rounded-full w-4 h-4 animate-spin"></div>
                    </div>
                )}
            </div>
            <button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-2.5 duration-100 rounded-full active:bg-emerald-700 ml-3">
                <svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 512 512"><path fill="#ffffff" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
            </button>
        </div>
    );
};

const interactiveIconUrl = '/images/flag-icon.png';
const nonInteractiveIconUrl = '/images/flag-icon-no-interact.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: interactiveIconUrl,
    iconUrl: interactiveIconUrl,
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [75, 41],
});

interface MapComponentProps {
    isButtonSelected: boolean;
    selectedButton: string | null;
    onCoordinatesUpdate: (coordinates: string) => void;
    isSameStartFinish: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ isButtonSelected, selectedButton, onCoordinatesUpdate, isSameStartFinish }) => {
    const [startLinePosition, setStartLinePosition] = useState<LatLng[]>([]);
    const [finishLinePosition, setFinishLinePosition] = useState<LatLng[]>([]);

    useEffect(() => {
        if (isSameStartFinish && startLinePosition.length === 2) {
          setFinishLinePosition([...startLinePosition]);
        } else if (!isSameStartFinish) {
          setFinishLinePosition([]);
        }
      }, [startLinePosition, isSameStartFinish]);

    useEffect(() => {
        setStartLinePosition(startLinePosition);
        setFinishLinePosition(finishLinePosition);
    }, [startLinePosition, finishLinePosition]);

    useEffect(() => {
        handleMapClick(startLinePosition, finishLinePosition);
        // eslint-disable-next-line
    }, [startLinePosition, finishLinePosition]);

    const handleMapClick = (start: L.LatLng[], finish: L.LatLng[]) => {
        if (isButtonSelected && start.length === 2 && selectedButton === 'start_coordinates') {
            const coordinates = `${start[0].lat},${start[0].lng};${start[1].lat},${start[1].lng}`;
            onCoordinatesUpdate(coordinates);
        }
        if (isButtonSelected && finish.length === 2 && selectedButton === 'end_coordinates') {
            const coordinates = `${finish[0].lat},${finish[0].lng};${finish[1].lat},${finish[1].lng}`;
            onCoordinatesUpdate(coordinates);
        }
    };

    const StartMarker = () => {
        useMapEvents({
            click(e) {
                if (isButtonSelected && selectedButton === 'start_coordinates') {
                    if (startLinePosition.length < 2) {
                        const updatedStart = [...startLinePosition, e.latlng];
                        setStartLinePosition(updatedStart);
                        handleMapClick(updatedStart, finishLinePosition);
                    } else {
                        const updatedStart = [e.latlng];
                        setStartLinePosition(updatedStart);
                        handleMapClick(updatedStart, finishLinePosition);
                    }
                }
            }
        });

        const startIcon = L.icon({
            iconUrl: selectedButton === 'start_coordinates' ? interactiveIconUrl : nonInteractiveIconUrl,
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [75, 41],
            iconAnchor: [12, 40],
        });

        return (
            <>
                {startLinePosition.map((position, index) => (
                    <Marker
                        key={`start-marker-${index}`}
                        position={position}
                        draggable={selectedButton === 'start_coordinates'}
                        icon={startIcon}
                        zIndexOffset={1000}
                        eventHandlers={{
                            dragend: (e) => {
                                if (selectedButton === 'start_coordinates') {
                                    const updatedPosition = e.target.getLatLng();
                                    setStartLinePosition(prev =>
                                        prev.map((pos, i) => i === index ? updatedPosition : pos)
                                    );
                                    if (isSameStartFinish) {
                                        setFinishLinePosition(prev =>
                                            prev.map((pos, i) => i === index ? updatedPosition : pos)
                                        );
                                    }
                                }
                            }
                        }}
                    />
                ))}
            </>
        );
    };

    const FinishMarker = () => {
        useMapEvents({
            click(e) {
                if (isButtonSelected && selectedButton === 'end_coordinates') {
                    if (finishLinePosition.length < 2) {
                        const updatedFinish = [...finishLinePosition, e.latlng];
                        setFinishLinePosition(updatedFinish);
                        handleMapClick(startLinePosition, updatedFinish);
                    } else {
                        const updatedFinish = [e.latlng];
                        setFinishLinePosition(updatedFinish);
                        handleMapClick(startLinePosition, updatedFinish);
                    }
                }
            }
        });

        const finishIcon = L.icon({
            iconUrl: selectedButton === 'end_coordinates' ? interactiveIconUrl : nonInteractiveIconUrl,
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [75, 41],
            iconAnchor: [12, 40],
        });

        return (
            <>
                {finishLinePosition.map((position, index) => (
                    <Marker
                        key={`finish-marker-${index}`}
                        position={position}
                        draggable={selectedButton === 'end_coordinates' && !isSameStartFinish}
                        icon={finishIcon}
                        zIndexOffset={isSameStartFinish ? -1000 : 0}
                        eventHandlers={{
                            dragend: (e) => {
                                if (selectedButton === 'end_coordinates') {
                                    const updatedPosition = e.target.getLatLng();
                                    setFinishLinePosition(prev =>
                                        prev.map((pos, i) => i === index ? updatedPosition : pos)
                                    );
                                }
                            }
                        }}
                    />
                ))}
            </>
        );
    };

    return (
        <MapContainer center={[50.0755, 14.4378]} zoom={13} style={{ height: "100%", width: "100%", borderRadius: '20px', overflow: 'hidden' }} className='border-2 border-red-300'>
            <TileLayer
                url="https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                attribution="© Google Maps"
            />
            <LocationSearch />
            <StartMarker />
            <FinishMarker />
            {startLinePosition.length === 2 && <Polyline positions={startLinePosition} color="limeGreen"/>}
            {finishLinePosition.length === 2 && <Polyline positions={finishLinePosition} color="darkRed" />}
        </MapContainer>
    );
};

export default MapComponent;
