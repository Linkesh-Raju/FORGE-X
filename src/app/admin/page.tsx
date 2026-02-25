"use client";
import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { X, ZoomIn } from 'lucide-react';

const AdminMap = dynamic(() => import('@/components/AdminMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-200 animate-pulse rounded-3xl flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest">
      Loading Satellite Feed...
    </div>
  )
});

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedImg, setSelectedImg] = useState<string | null>(null); 
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/admin/login');
      else setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setComplaints(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const resolveIssue = async (id: string) => {
    await updateDoc(doc(db, "complaints", id), { status: "Resolved ✅" });
  };

  if (!user) return (
    <div className="h-screen flex items-center justify-center font-bold text-blue-500 animate-pulse uppercase tracking-widest">
      Verifying Authority...
    </div>
  );

  const totalFixed = complaints.filter(c => c.status === "Resolved ✅").length;

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              CITYFIX <span className="text-blue-600">AUTHORITY</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
              Real-time infrastructure monitoring
            </p>
          </div>
          <button 
            onClick={() => signOut(auth)} 
            className="px-6 py-2 bg-white text-red-500 border border-red-100 rounded-xl font-bold hover:bg-red-50 transition-all shadow-sm"
          >
            Logout
          </button>
        </header>

        {/* STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-center">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Reports</p>
            <p className="text-4xl font-black text-slate-800">{complaints.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Resolved</p>
            <p className="text-4xl font-black text-green-500">{totalFixed}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Pending</p>
            <p className="text-4xl font-black text-orange-500">{complaints.length - totalFixed}</p>
          </div>
        </div>

        {/* LIVE MAP SECTION */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Geographic View</h2>
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
          </div>
          <AdminMap complaints={complaints} />
        </div>

        {/* FEED */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">Incident Feed</h2>
          {complaints.map((item) => (
            <div 
              key={item.id} 
              className={`p-6 rounded-3xl shadow-xl transition-all flex flex-col md:flex-row gap-8 items-start border border-transparent ${
                item.status === 'Resolved ✅' ? 'bg-green-50/50 grayscale-[0.3]' : 'bg-white'
              }`}
            >
              <div className="w-full md:w-64 shrink-0">
                {item.images && item.images.length > 0 ? (
                  <div className={`grid gap-2 ${item.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {item.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedImg(img)}>
                        <img 
                          src={img} 
                          className={`object-cover rounded-xl shadow-inner bg-slate-200 group-hover:brightness-75 transition-all ${
                            item.images.length === 1 ? 'w-full h-56' : 'w-full h-28'
                          }`} 
                          alt={`Evidence ${idx + 1}`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="text-white" size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-56 bg-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-400 text-xs">
                    NO PHOTO
                  </div>
                )}
              </div>

              <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-blue-600 uppercase tracking-tight">
                      {item.name || "Anonymous User"}
                    </span>
                    <a href={`tel:${item.phone}`} className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors">
                      {item.phone || "No Phone Provided"}
                    </a>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase">
                    {item.createdAt?.toDate 
                      ? item.createdAt.toDate().toLocaleDateString() 
                      : new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">{item.description}</h3>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-4 text-sm font-bold text-blue-500">
                     <span className="bg-slate-100 px-3 py-1 rounded-lg tracking-tighter border border-slate-200">
                       📍 GPS: {item.lat?.toFixed(5)}, {item.lng?.toFixed(5)}
                     </span>
                  </div>

                  {item.status !== "Resolved ✅" && (
                    <button 
                      onClick={() => resolveIssue(item.id)} 
                      className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-green-500 transition-all shadow-lg shadow-blue-200 uppercase tracking-widest text-xs"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FIXED MODAL PLACEMENT - MOVED TO THE BOTTOM FOR BETTER Z-INDEX HANDLING */}
      {selectedImg && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ zIndex: 10000 }} // Ensures it sits above the map and everything else
          onClick={() => setSelectedImg(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedImg(null)}
          >
            <X size={48} strokeWidth={3} />
          </button>
          
          {/* Image Container */}
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
            <img 
              src={selectedImg} 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10 object-contain animate-in zoom-in-95 duration-200"
              alt="Expanded evidence"
              onClick={(e) => e.stopPropagation()} // Crucial: Clicking the image doesn't close it
            />
          </div>
          
          <p className="absolute bottom-6 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
            Click anywhere to exit view
          </p>
        </div>
      )}
    </div>
  );
}