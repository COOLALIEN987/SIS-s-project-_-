import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, User, Search } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet's default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock Data removed

// Component to handle auto-fitting bounds based on data
function MapUpdater({ leads, studios }: { leads: any[], studios: any[] }) {
    const map = useMap();

    useEffect(() => {
        const bounds = L.latLngBounds([]);
        let hasPoints = false;

        leads.forEach((l) => {
            if (l.lat && l.lng) { bounds.extend([l.lat, l.lng]); hasPoints = true; }
        });

        studios.forEach((s) => {
            if (s.lat && s.lng) { bounds.extend([s.lat, s.lng]); hasPoints = true; }
        });

        if (hasPoints && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } else {
            map.setView([20.5937, 78.9629], 5); // Default to India Center
        }
    }, [leads, studios, map]);

    return null;
}

export function MapView() {
    const [leads, setLeads] = useState<any[]>([]);
    const [studios, setStudios] = useState<any[]>([]);
    const [showRadius, setShowRadius] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const [leadsRes, studiosRes] = await Promise.all([
                fetch('/api/leads?limit=500', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/dashboard/studios', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const leadsData = await leadsRes.json();
            const studiosData = await studiosRes.json();

            if (leadsData.data) setLeads(leadsData.data);
            if (studiosData.data) setStudios(studiosData.data);
        } catch (err) {
            console.error('Failed to fetch map data', err);
        }
    };

    // Custom Icon for Leads
    const leadIcon = new L.DivIcon({
        className: 'bg-transparent',
        html: `<div class="w-4 h-4 rounded-full bg-accent border-2 border-white shadow-lg"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });

    // Custom Icon for Studios
    const studioIcon = (color: string) => new L.DivIcon({
        className: 'bg-transparent',
        html: `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full opacity-30 shadow-[0_0_15px_rgba(0,0,0,0.5)]" style="background-color: ${color}"></div>
        <div class="w-4 h-4 rounded-full z-10 border-2 border-background" style="background-color: ${color}"></div>
      </div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-heading text-foreground tracking-wide">Nationwide Map</h1>
                    <p className="text-muted-foreground">Visualize studios, lead density, and plan field agent routes across India.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            placeholder="Search area..."
                            className="bg-secondary border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-md text-sm text-foreground hover:bg-secondary/80 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={() => setShowRadius(!showRadius)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showRadius ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                        {showRadius ? 'Hide 3km Radius' : 'Show 3km Radius'}
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden relative">
                <MapContainer
                    center={[20.5937, 78.9629]} // India Center default
                    zoom={5}
                    className="w-full h-full"
                    zoomControl={false}
                >
                    <MapUpdater leads={leads} studios={studios} />

                    {/* Dark Mode Map Tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                    />

                    {/* Render Studios and 3km Radius */}
                    {studios.map(studio => (
                        <div key={`studio-group-${studio.id}`}>
                            {studio.lat && studio.lng && (
                                <Marker position={[studio.lat, studio.lng]} icon={studioIcon('#C9F31D')}>
                                    <Popup className="bg-card text-foreground border border-border">
                                        <div className="p-2">
                                            <h3 className="font-bold text-sm mb-1">{studio.name} Studio</h3>
                                            <p className="text-xs text-muted-foreground">Tap to view metrics</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {showRadius && studio.lat && studio.lng && (
                                <Circle
                                    center={[studio.lat, studio.lng]}
                                    radius={3000} // 3km in meters
                                    pathOptions={{ color: '#C9F31D', fillColor: '#C9F31D', fillOpacity: 0.1, weight: 1 }}
                                />
                            )}
                        </div>
                    ))}

                    {/* Render Leads */}
                    {leads.map(lead => {
                        if (!lead.lat || !lead.lng) return null;
                        return (
                            <Marker key={lead.id} position={[lead.lat, lead.lng]} icon={leadIcon}>
                                <Popup className="bg-card border-none rounded-lg overflow-hidden shadow-2xl p-0 min-w-[200px]">
                                    <div className="bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#2A2A2A]">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm text-[#F5F5F5] leading-tight">{lead.name || 'Unknown Lead'}</h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                                    <span className="text-[10px] text-muted-foreground">{(lead.status || 'NEW').replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 pt-1">
                                            <p className="text-xs flex items-center justify-between text-[#888888]">
                                                Score: <span className="text-[#C9F31D] font-bold">{lead.score || 50}</span>
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <button className="text-[10px] uppercase font-bold text-primary hover:underline">View Profile</button>
                                                <button className="text-[10px] uppercase font-bold text-accent hover:underline">Get Directions</button>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Floating Legend */}
                <div className="absolute bottom-6 right-6 z-[400] bg-card/90 backdrop-blur-md border border-border p-4 rounded-lg shadow-xl">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Legend</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-accent"></span>
                            <span className="text-sm text-foreground">Lead Location</span>
                        </div>
                        {studios.map(s => (
                            <div key={s.id} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full border border-background ring-1" style={{ borderColor: '#C9F31D', backgroundColor: '#C9F31D' }}></span>
                                <span className="text-sm text-foreground">{s.name} Studio</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
