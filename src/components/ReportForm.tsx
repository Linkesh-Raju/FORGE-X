"use client";

import React, { useState } from 'react';
import { db, storage } from '@/lib/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { MapPin, Camera, User, Phone, X, CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import { jsPDF } from "jspdf";

export default function ReportForm() {
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalId, setFinalId] = useState("");
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    name: '',
    phone: '+91 ', 
    aadhar: '',
    description: '', 
    lat: null as number | null, 
    lng: null as number | null,
    images: [] as string[] 
  });

  const generateComplaintId = () => {
    return `CF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setFormData({ ...formData, aadhar: formatted });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (!input.startsWith("+91 ")) {
      setFormData({ ...formData, phone: "+91 " });
    } else {
      const digitsOnly = input.slice(4).replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: `+91 ${digitsOnly}` });
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, compressed]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const downloadReceipt = () => {
    if (!receiptData) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("CITYFIX AUTHORITY", 20, 30);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("OFFICIAL CITIZEN COMPLAINT RECEIPT", 20, 38);
    doc.line(20, 45, 190, 45);
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Complaint ID: ${finalId}`, 20, 60);
    doc.text(`Aadhar: ${receiptData.aadhar}`, 20, 70);
    doc.text(`Reporter: ${receiptData.name}`, 20, 80);
    doc.text(`Phone: ${receiptData.phone}`, 20, 90);
    doc.text(`Location: ${receiptData.lat}, ${receiptData.lng}`, 20, 100);
    doc.setFontSize(14);
    doc.text("Description:", 20, 120);
    const splitDesc = doc.splitTextToSize(receiptData.description, 170);
    doc.text(splitDesc, 20, 130);
    doc.save(`CityFix_Receipt_${finalId}.pdf`);
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus("Fetching location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData({ ...formData, lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus("📍 Location Verified");
        },
        () => setLocationStatus("❌ Failed to get location")
      );
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ADD THIS: Prevent submission if location is missing (Solves logical empty data)
  if (!formData.lat || !formData.lng) {
    return alert("Please verify your location first!");
  }

  setLoading(true);

  try {
    const complaintId = generateComplaintId();

    // ERROR SOURCE 1: If this fails, it's a CORS issue
    const imageUrls = await Promise.all(
      formData.images.map(async (base64, index) => {
        const storageRef = ref(storage, `public_reports/${complaintId}/img_${index}`);
        const uploadTask = await uploadString(storageRef, base64, 'data_url');
        return await getDownloadURL(uploadTask.ref);
      })
    );

    const submissionPayload = {
      complaintId,
      name: formData.name,
      phone: formData.phone,
      aadhar: formData.aadhar,
      description: formData.description,
      lat: formData.lat,
      lng: formData.lng,
      images: imageUrls,
      status: "Pending ⏳",
      createdAt: serverTimestamp(), 
    };

    // ERROR SOURCE 2: If this fails, it's a Permission issue
    await addDoc(collection(db, "complaints"), submissionPayload);
    
    // HANDLE SUCCESS HERE: Only show success if database write actually worked
    setReceiptData(submissionPayload); 
    setFinalId(complaintId);
    setShowSuccess(true);

  } catch (error: any) {
    // CATCHING THE SPECIFIC DATABASE ERRORS
    console.error("Database Error:", error.code);
    
    if (error.code === 'permission-denied') {
      alert("Database Error: Access Denied. Update your Firebase Rules to 'allow write: if true'.");
    } else {
      alert("Connection Error: " + error.message);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4 text-slate-800 max-w-lg mx-auto">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tight">Report Incident</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Citizen Security Portal</p>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-[10px] font-black mb-1 ml-1 text-slate-500 uppercase tracking-tighter">Aadhar Number</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" required placeholder="XXXX XXXX XXXX XXXX"
                className="w-full p-3 pl-10 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-[0.2em]" 
                value={formData.aadhar} onChange={handleAadharChange}
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-black mb-1 ml-1 text-slate-500 uppercase tracking-tighter">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" required placeholder="Enter your name"
                className="w-full p-3 pl-10 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-black mb-1 ml-1 text-slate-500 uppercase tracking-tighter">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="tel" required
                className="w-full p-3 pl-10 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                value={formData.phone} onChange={handlePhoneChange}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black mb-1 ml-1 text-slate-500 uppercase tracking-tighter">Issue Description</label>
          <textarea 
            required placeholder="Describe the incident..."
            className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]" 
            value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={captureLocation} type="button" className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all ${formData.lat ? 'bg-green-50 border-green-500 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
            <MapPin size={24} />
            <span className="text-[10px] font-black mt-2 uppercase">{locationStatus || 'Location'}</span>
          </button>
          
          <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${formData.images.length > 0 ? 'bg-green-50 border-green-500 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
            <Camera size={24} />
            <span className="text-[10px] font-black mt-2 uppercase">Photos ({formData.images.length})</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageCapture} />
          </label>
        </div>

        {formData.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {formData.images.map((img, index) => (
              <div key={index} className="relative min-w-[60px] h-16">
                <img src={img} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                <button type="button" onClick={() => removeImage(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}

        <button disabled={loading} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
          {loading ? "UPLOADING..." : "SUBMIT REPORT"}
        </button>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center border border-slate-100">
            <CheckCircle2 className="mx-auto text-green-500 mb-4" size={50} />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Success!</h2>
            <p className="text-slate-500 text-sm mb-6">Your report has been filed successfully.</p>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Complaint ID</p>
              <p className="text-xl font-mono font-black text-blue-600 tracking-wider">{finalId}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={downloadReceipt} className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm border border-blue-100">
                <Download size={18} /> Download Receipt
              </button>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}