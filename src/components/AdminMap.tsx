"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Define the RED icon (Pending)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// 2. Define the GREEN icon (Resolved)
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function AdminMap({ complaints }: { complaints: any[] }) {
  // Default center: Uses the first complaint or Chennai coordinates if empty
  const defaultCenter: [number, number] = [13.0827, 80.2707];
  const center = complaints.length > 0 ? [complaints[0].lat, complaints[0].lng] : defaultCenter;

  return (
    <div className="h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white mb-10 relative z-0">
      <MapContainer 
        center={center as any} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {complaints.map((item) => (
          <Marker 
            key={item.id} 
            position={[item.lat, item.lng]} 
            // 3. Logic: If status is Resolved, use Green, otherwise use Red
            icon={item.status === "Resolved ✅" ? greenIcon : redIcon}
          >
            <Popup>
              <div className="font-sans p-1 text-slate-800">
                <p className="font-black text-blue-600 uppercase text-[10px] m-0 leading-tight">
                  Reporter: {item.name || "Unknown"}
                </p>
                <p className="text-sm font-bold my-1">{item.description}</p>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                  item.status === 'Resolved ✅' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.status === 'Resolved ✅' ? 'FIXED' : 'PENDING'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}