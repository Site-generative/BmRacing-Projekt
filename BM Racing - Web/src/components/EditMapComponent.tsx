import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';

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
                alert('Location not found.');
            }
        } catch (error) {
            console.error('Error fetching location:', error);
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

const parseCoordinates = (coords: string): L.LatLng[] => {
    return coords.split(';').map(coord => {
        const [lat, lng] = coord.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) {
            return null;
        }
        return new L.LatLng(lat, lng);
    }).filter((coord): coord is L.LatLng => coord !== null);
};

const getMapCenter = (coords: L.LatLng[]): L.LatLng => {
    if (coords.length === 0) return new L.LatLng(0, 0);

    const latitudes = coords.map(coord => coord.lat);
    const longitudes = coords.map(coord => coord.lng);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    return new L.LatLng(centerLat, centerLng);
};

interface EditMapComponentProps {
    isButtonSelected: boolean;
    selectedButton: string | null;
    onCoordinatesUpdate: (coordinates: string) => void;
    startCoordinates: string;
    endCoordinates: string;
}

const EditMapComponent: React.FC<EditMapComponentProps> = ({ isButtonSelected, selectedButton, onCoordinatesUpdate, startCoordinates, endCoordinates }) => {
    const [startLinePosition, setStartLinePosition] = useState<L.LatLng[]>(parseCoordinates(startCoordinates));
    const [finishLinePosition, setFinishLinePosition] = useState<L.LatLng[]>(parseCoordinates(endCoordinates));

    useEffect(() => {
        setStartLinePosition(parseCoordinates(startCoordinates));
        setFinishLinePosition(parseCoordinates(endCoordinates));
    }, [startCoordinates, endCoordinates]);

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
                        interactive={selectedButton === 'start_coordinates'}
                        icon={startIcon}
                        eventHandlers={{
                            dragend: (e) => {
                                const updatedPosition = e.target.getLatLng();
                                const updatedStart = startLinePosition.map((pos, i) => i === index ? updatedPosition : pos);
                                setStartLinePosition((prev) => prev.map((pos, i) => i === index ? updatedPosition : pos));
                                handleMapClick(updatedStart, finishLinePosition);
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
                        draggable={selectedButton === 'end_coordinates'}
                        interactive={selectedButton === 'end_coordinates'}
                        icon={finishIcon}
                        eventHandlers={{
                            dragend: (e) => {
                                const updatedPosition = e.target.getLatLng();
                                const updatedFinish = finishLinePosition.map((pos, i) => i === index ? updatedPosition : pos);
                                setFinishLinePosition((prev) => prev.map((pos, i) => i === index ? updatedPosition : pos));
                                handleMapClick(startLinePosition, updatedFinish);
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
            {startLinePosition.length === 2 && <Polyline positions={startLinePosition} color="limeGreen" />}
            {finishLinePosition.length === 2 && <Polyline positions={finishLinePosition} color="darkRed" />}
            <MapCenterSetter coordinates={[...startLinePosition, ...finishLinePosition]} />
        </MapContainer>
    );
};

const MapCenterSetter = ({ coordinates }: { coordinates: L.LatLng[] }) => {
    const map = useMap();
    const hasCenteredRef = useRef(false);

    useEffect(() => {
        if (!hasCenteredRef.current && coordinates.length > 0) {
          const center = getMapCenter(coordinates);
          map.setView(center, map.getZoom());
          hasCenteredRef.current = true;
        }
      }, [coordinates, map]);

    return null;
};

export default EditMapComponent;