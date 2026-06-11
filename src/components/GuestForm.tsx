import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { QRCodeSVG } from 'qrcode.react';
import { VisitData } from '../types.ts';
import { motion } from 'motion/react';
import { CheckCircle2, User, Building, Phone, Mail, MapPin, Briefcase, Camera, RefreshCcw } from 'lucide-react';

export default function GuestForm() {
  const [formData, setFormData] = useState<VisitData>({
    namaLengkap: '',
    nik: '',
    instansi: '',
    jabatan: '',
    noHp: '',
    email: '',
    alamat: '',
    keperluan: '',
    keteranganLainnya: '',
    tujuanBertemu: '',
    bidangTujuan: '',
    jumlahPengunjung: 1,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<VisitData | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigWrapperRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [sigSize, setSigSize] = useState({ width: 300, height: 160 });
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [webcamError, setWebcamError] = useState<string | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (sigWrapperRef.current) {
        setSigSize({ 
          width: sigWrapperRef.current.offsetWidth, 
          height: sigWrapperRef.current.offsetHeight 
        });
      }
    };
    // Initial size
    setTimeout(updateSize, 100); 
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setPhoto(imageSrc);
          setWebcamError(null);
        } else {
          setWebcamError("Gagal mengambil gambar, pastikan kamera aktif.");
        }
      } catch (err) {
        setWebcamError("Gagal mengambil gambar.");
      }
    }
  }, [webcamRef]);

  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' }));
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#004B87';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [sigSize]);

  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      const ctx = sigCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
      }
      setHasSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      alert("Mohon ambil foto Anda terlebih dahulu sebelum menyimpan data.");
      return;
    }

    setIsSubmitting(true);
    try {
      let signatureUrl = '';
      if (hasSignature && sigCanvasRef.current) {
        signatureUrl = sigCanvasRef.current.toDataURL('image/png');
      }

      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, signatureUrl, photoUrl: photo }),
      });

      if (res.ok) {
        const result = await res.json();
        setSuccess(result.visit);
      } else {
        alert("Gagal menyimpan data.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentKeperluans = [
    "Konsultasi Program",
    "Koordinasi Kegiatan",
    "Audiensi",
    "Pengambilan Dokumen",
    "Pelatihan/Bimtek",
    "Monitoring dan Evaluasi",
    "Kunjungan Kerja",
    "Lainnya"
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans antialiased text-slate-900">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8 border-[#004B87]"
        >
          <CheckCircle2 className="w-20 h-20 text-[#004B87] mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[#004B87] mb-2">Terima Kasih!</h2>
          <p className="text-slate-600 mb-6">Data kunjungan Anda telah berhasil disimpan.</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Nomor Kunjungan Anda:</p>
            <p className="text-2xl font-mono font-bold text-[#004B87]">{success.visitNumber}</p>
          </div>
          <button 
            onClick={() => {
              setSuccess(null);
              setFormData({ namaLengkap: '', nik: '', instansi: '', jabatan: '', noHp: '', email: '', alamat: '', keperluan: '', keteranganLainnya: '', tujuanBertemu: '', bidangTujuan: '', jumlahPengunjung: 1 });
              setPhoto(null);
              setIsCameraActive(false);
              handleClearSignature();
            }}
            className="w-full bg-[#004B87] text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-800 transition shadow-lg shadow-blue-900/10"
          >
            Isi Buku Tamu Baru
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans antialiased text-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-24 bg-white flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 flex-shrink-0 z-10">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
            alt="Logo Tut Wuri Handayani" 
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm"
          />
          <div className="flex flex-col justify-center">
            <div className="text-xl sm:text-[26px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <span className="text-[#0072bc]">Kemen</span><span className="text-[#f5a800]">dikdasmen</span>
            </div>
            <div className="text-xs sm:text-[15px] font-bold text-[#222] tracking-wide mt-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              BPMP Lampung
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-6 text-slate-600">
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-slate-400">Waktu Kunjungan</p>
            <p className="text-sm font-mono font-medium max-w-[200px] truncate text-slate-700">{currentDate} | {currentTime}</p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <Link to="/admin" className="flex items-center gap-2 hover:bg-slate-200 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 transition-colors">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-600">ADMIN PANEL</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[320px] bg-slate-50 border-r border-slate-200 p-6 flex-col gap-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-3">Statistik Kunjungan</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-[#004B87]">-</p>
                  <p className="text-[10px] text-slate-600">Total Tamu</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">0</p>
                  <p className="text-[10px] text-slate-600">Sesi Aktif</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-3">Check-in Cepat</p>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 py-4 rounded-lg">
                <QRCodeSVG value={window.location.href} size={84} level="H" includeMargin={false} fgColor="#004B87" />
                <p className="text-[11px] text-slate-400 mt-3">Scan QR Code untuk akses dari HP</p>
              </div>
            </div>
            <div className="mt-auto p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
              <div className="flex gap-3">
                <svg className="text-yellow-600 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <p className="text-xs font-bold text-yellow-800">Informasi</p>
                  <p className="text-[11px] text-yellow-700 leading-tight mt-1">Siapkan identitas diri (NIK) dan surat tugas jika ada untuk mempercepat proses pendataan.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Form Section */}
        <section className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col bg-slate-50/50">
          <div className="max-w-3xl mx-auto w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#004B87]">Registrasi Buku Tamu</h2>
              <p className="text-slate-500 text-sm">Silakan lengkapi data kunjungan Anda pada formulir di bawah ini.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 mb-8">
              
              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Lengkap <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4"/></div>
                  <input type="text" name="namaLengkap" required value={formData.namaLengkap} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Masukkan nama lengkap" />
                </div>
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">NIK (Opsional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4"/></div>
                  <input type="text" name="nik" value={formData.nik} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Nomor Induk Kependudukan" />
                </div>
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Instansi / Asal <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Building className="w-4 h-4"/></div>
                  <input type="text" name="instansi" required value={formData.instansi} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Asal instansi atau sekolah" />
                </div>
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Jabatan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-4 h-4"/></div>
                  <input type="text" name="jabatan" required value={formData.jabatan} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Jabatan Anda" />
                </div>
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Nomor HP/WhatsApp <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone className="w-4 h-4"/></div>
                  <input type="tel" name="noHp" required value={formData.noHp} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="08..." />
                </div>
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4"/></div>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="alamat@email.com" />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Alamat Lengkap <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none text-slate-400"><MapPin className="w-4 h-4"/></div>
                  <textarea name="alamat" required rows={2} value={formData.alamat} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 resize-none" placeholder="Alamat instansi atau rumah"></textarea>
                </div>
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Keperluan Kunjungan <span className="text-red-500">*</span></label>
                <select name="keperluan" required value={formData.keperluan} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900">
                  <option value="" disabled>-- Pilih Keperluan --</option>
                  {currentKeperluans.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {formData.keperluan === 'Lainnya' && (
                 <div className="col-span-1 space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase">Keterangan Lainnya <span className="text-red-500">*</span></label>
                   <input type="text" name="keteranganLainnya" required value={formData.keteranganLainnya || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Jelaskan secara singkat" />
                 </div>
              )}

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Jumlah Pengunjung <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4"/></div>
                  <input type="number" min="1" name="jumlahPengunjung" required value={formData.jumlahPengunjung} onChange={handleChange} className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" />
                </div>
              </div>
              
              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Tujuan Bertemu Dengan <span className="text-red-500">*</span></label>
                <input type="text" name="tujuanBertemu" required value={formData.tujuanBertemu} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Nama pegawai yang dituju" />
              </div>

              <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Bidang/Unit Tujuan <span className="text-red-500">*</span></label>
                <input type="text" name="bidangTujuan" required value={formData.bidangTujuan} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900" placeholder="Subbag Umum / Pokja dll" />
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tanda Tangan Digital <span className="text-red-500">*</span></label>
                  <div ref={sigWrapperRef} className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg relative overflow-hidden touch-none group">
                    <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs italic pointer-events-none">Silakan tanda tangan di sini</span>
                    <canvas 
                      ref={sigCanvasRef} 
                      width={sigSize.width}
                      height={sigSize.height}
                      className="absolute inset-0 cursor-crosshair z-10"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseOut={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button type="button" onClick={handleClearSignature} className="absolute bottom-2 right-2 text-[10px] uppercase font-bold bg-white text-slate-500 border border-slate-200 px-3 py-1 rounded shadow-sm hover:bg-slate-100 z-20">
                      Bersihkan
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Foto Pengunjung <span className="text-red-500">*</span></label>
                  <div className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg relative overflow-hidden flex items-center justify-center group">
                    {!photo ? (
                      isCameraActive ? (
                        <div className="absolute inset-0 z-10 overflow-hidden bg-black flex flex-col items-center justify-center">
                           <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              videoConstraints={{ facingMode: "user" }}
                              className="w-full h-full object-cover"
                              onUserMediaError={(err) => setWebcamError("Akses kamera ditolak atau kamera tidak ditemukan.")}
                           />
                           <button type="button" onClick={capturePhoto} className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 z-20">
                             <Camera className="w-5 h-5"/>
                           </button>
                           <button type="button" onClick={() => setIsCameraActive(false)} className="absolute top-2 right-2 text-white bg-black/50 text-[10px] px-2 py-1 rounded z-20">
                             Batal
                           </button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 z-10 overflow-hidden bg-slate-100 flex flex-col items-center justify-center text-slate-500">
                          <button type="button" onClick={() => setIsCameraActive(true)} className="flex flex-col items-center justify-center p-4 hover:text-blue-600 transition-colors">
                            <Camera className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs font-semibold">Buka Kamera</span>
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="relative w-full h-full group z-10">
                        <img src={photo} alt="Pengunjung" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setPhoto(null)} className="absolute inset-0 w-full h-full bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <RefreshCcw className="w-6 h-6 mb-2" />
                          <span className="text-xs font-medium">Ambil Ulang</span>
                        </button>
                      </div>
                    )}
                    {webcamError && (
                      <div className="absolute inset-x-0 bottom-0 py-1 bg-red-600 text-white text-[10px] text-center z-30">
                        {webcamError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!photo && <p className="col-span-1 md:col-span-2 text-xs text-red-500 font-medium">* Ambil foto terlebih dahulu untuk menyimpan data.</p>}

              <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-3 mt-2">
                <button type="button" onClick={(e) => {
                  if(!photo) {
                     alert("Mohon ambil foto Anda menggunakan kamera sebelum menyimpan data.");
                     return;
                  }
                  // Let the form submit normally if clicked
                  const form = e.currentTarget.closest('form');
                  if (form && form.checkValidity()) {
                    // It will trigger onSubmit since it passes checks
                  } else {
                     form?.reportValidity(); // This forces the HTML5 tooltips
                  }
                }} className="absolute opacity-0 pointer-events-none" />
                <button type="submit" disabled={isSubmitting || !photo} className="flex-1 bg-[#004B87] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Kunjungan'}
                </button>
                <button type="button" onClick={() => {
                   setFormData({namaLengkap: '', nik: '', instansi: '', jabatan: '', noHp: '', email: '', alamat: '', keperluan: '', keteranganLainnya: '', tujuanBertemu: '', bidangTujuan: '', jumlahPengunjung: 1});
                   setPhoto(null);
                   handleClearSignature();
                }} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                  Reset
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="hidden sm:flex h-12 bg-white border-t border-slate-200 items-center justify-between px-8 text-[11px] text-slate-500 flex-shrink-0 z-10">
        <div>&copy; {new Date().getFullYear()} BPMP Lampung - Sistem Informasi Buku Tamu Online</div>
        <div className="flex items-center space-x-4">
          <span>Versi 2.1.0</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="font-medium">Sistem Terhubung</span>
        </div>
      </footer>
    </div>
  );
}
