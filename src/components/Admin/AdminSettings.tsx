import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [email, setEmail] = useState(() => localStorage.getItem('bpmp_target_email') || 'bpmplpg@gmail.com');
  const [pin, setPin] = useState(() => localStorage.getItem('bpmp_admin_pin') || '');

  const handleSave = () => {
    localStorage.setItem('bpmp_target_email', email);
    localStorage.setItem('bpmp_admin_pin', pin);
    alert('Pengaturan berhasil disimpan.');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-500 mt-1">Kelola preferensi dan keamanan admin panel.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Target Notifikasi & Sinkronisasi
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border-gray-300 border bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="nama@email.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email yang akan digunakan untuk berbagi akses Spreadsheet dan notifikasi lainnya.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kode Authenticator (PIN Admin)
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border-gray-300 border bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kosongkan jika tidak ingin menggunakan PIN"
          />
          <p className="text-xs text-gray-500 mt-1">
            Jika diisi, pengunjung yang ingin masuk ke halaman Admin Panel akan dimintai PIN ini sebelum bisa login dengan akun Google.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
