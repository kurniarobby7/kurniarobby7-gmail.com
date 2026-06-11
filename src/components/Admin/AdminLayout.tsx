import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, googleAuthProvider } from '../../lib/firebase.ts';
import { signInWithPopup, onAuthStateChanged, User, signOut, GoogleAuthProvider } from 'firebase/auth';
import { LayoutDashboard, Users, FileSpreadsheet, LogOut, Loader2, Settings, Lock, Home } from 'lucide-react';

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const adminPin = localStorage.getItem('bpmp_admin_pin');
  const [isUnlocked, setIsUnlocked] = useState(!adminPin || sessionStorage.getItem('bpmp_admin_unlocked') === 'true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const targetEmail = localStorage.getItem('bpmp_target_email') || 'bpmplpg@gmail.com';
          const allowedEmails = [targetEmail.toLowerCase(), 'kurniarobby7@gmail.com', 'bpmplpg@gmail.com'];
          if (currentUser.email && !allowedEmails.includes(currentUser.email.toLowerCase())) {
            await signOut(auth);
            alert(`Akses ditolak. Silakan login dengan akun yang diizinkan (misal: ${targetEmail}).\n\nJika terblokir "developer", pastikan akun ada di Google Cloud "Test Users".`);
            setUser(null);
            setToken(null);
            setGoogleAccessToken(null);
            setLoading(false);
            return;
          }
          const idToken = await currentUser.getIdToken();
          setUser(currentUser);
          setToken(idToken);
        } catch (err: any) {
          console.error("Error getting token:", err);
          if (err.code === 'auth/user-disabled') {
            await signOut(auth); // force logout
            alert("Akun ini telah dinonaktifkan oleh administrator.");
          }
          setUser(null);
          setToken(null);
          setGoogleAccessToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
        setGoogleAccessToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      googleAuthProvider.setCustomParameters({
        prompt: 'select_account'
      });
      googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
      googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed the popup or cancelled request, ignore entirely
        console.log('Login popup was closed or cancelled by the user.');
      } else if (err.code === 'auth/user-disabled') {
        alert("Akun ini telah dinonaktifkan oleh administrator. Silakan gunakan akun lain.");
      } else {
        console.error("Login failed:", err);
        alert("Login failed: " + err.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGoogleAccessToken(null);
    sessionStorage.removeItem('bpmp_admin_unlocked');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      sessionStorage.setItem('bpmp_admin_unlocked', 'true');
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-sm w-full text-center">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Keamanan Admin</h1>
          <p className="text-gray-500 mb-6 text-sm">Masukkan PIN Authenticator untuk mengakses Admin Panel.</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className={`w-full text-center tracking-[0.5em] text-2xl font-mono rounded-lg border py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${pinError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 bg-white'}`}
                placeholder="••••"
                autoFocus
              />
              {pinError && <p className="text-red-500 text-xs mt-2 font-medium">PIN yang Anda masukkan salah.</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md"
            >
              Buka Akses
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-500 mb-8 text-sm">Masuk untuk mengelola data tamu.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Data Tamu', path: '/admin/data', icon: Users },
    { name: 'Pengaturan', path: '/admin/settings', icon: Settings },
    { name: 'Kembali ke Buku Tamu', path: '/', icon: Home },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 leading-tight">Admin System</h2>
          <p className="text-sm text-gray-500">BPMP Provinsi Lampung</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Admin BPMP</h2>
          <button onClick={handleLogout} className="text-gray-500"><LogOut className="w-5 h-5"/></button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <Outlet context={{ token, googleAccessToken, handleLogin }} />
        </div>
      </main>
    </div>
  );
}
