import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { VisitData } from '../../types.ts';
import { Search, Filter, Download, RefreshCw, FileSpreadsheet, ToggleLeft, ToggleRight } from 'lucide-react';
import * as ExcelJS from 'exceljs';

export default function AdminDataList() {
  const { token, googleAccessToken, handleLogin } = useOutletContext<{ token: string, googleAccessToken: string | null, handleLogin: () => void }>();
  const [data, setData] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem('bpmp_spreadsheet_id') || '');
  const [isEditingSheetId, setIsEditingSheetId] = useState(!spreadsheetId);
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('bpmp_auto_sync') === 'true');

  const toggleAutoSync = () => {
    const newVal = !autoSync;
    setAutoSync(newVal);
    localStorage.setItem('bpmp_auto_sync', newVal.toString());
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    let interval: any;
    if (autoSync && !syncing && googleAccessToken) {
      interval = setInterval(async () => {
        // Fetch fresh data
        try {
          const res = await fetch('/api/admin/visits', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const result = await res.json();
          setData(result);
          
          const unsynced = result.filter((d: any) => !d.syncedToSheets);
          if (unsynced.length > 0) {
            handleSyncToSheets(unsynced);
          }
        } catch (err) {
          console.error("Auto sync poll error:", err);
        }
      }, 10000); // Check every 10 seconds
    }
    return () => clearInterval(interval);
  }, [autoSync, syncing, googleAccessToken, token, spreadsheetId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/visits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSheetId = () => {
    localStorage.setItem('bpmp_spreadsheet_id', spreadsheetId);
    setIsEditingSheetId(false);
  };

  const uploadToDrive = async (base64Data: string, filename: string, folderId: string, token: string) => {
    try {
      const res = await fetch(base64Data);
      const blob = await res.blob();
      
      const metadata = { name: filename, parents: [folderId] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      
      if (!uploadRes.ok) return "";
      const uploadData = await uploadRes.json();
      return uploadData.webViewLink;
    } catch (e) {
      console.error("Upload failed", e);
      return "";
    }
  };

  const handleSyncToSheets = async (passedUnsynced?: VisitData[]) => {
    if (!googleAccessToken) {
      if (!passedUnsynced) alert("Anda perlu menghubungkan ulang akun Google. Silakan klik 'Hubungkan Google'.");
      return;
    }
    const unsynced = passedUnsynced || data.filter(d => !d.syncedToSheets);
    if (unsynced.length === 0) {
      if (!passedUnsynced) alert("Semua data sudah disinkronisasi.");
      return;
    }

    setSyncing(true);
    let currentSheetId = spreadsheetId;
    let driveFolderId = localStorage.getItem('bpmp_drive_folder_id');

    try {
      // 1. Create Spreadsheet if not exists
      if (!currentSheetId) {
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: { title: "Buku Tamu BPMP Lampung - Auto Generated" }
          })
        });
        if (!createRes.ok) throw new Error("Gagal membuat Spreadsheet");
        const createData = await createRes.json();
        currentSheetId = createData.spreadsheetId;
        setSpreadsheetId(currentSheetId);
        localStorage.setItem('bpmp_spreadsheet_id', currentSheetId);

        const targetEmail = localStorage.getItem('bpmp_target_email') || 'bpmplpg@gmail.com';
        // Share Spreadsheet with email
        await fetch(`https://www.googleapis.com/drive/v3/files/${currentSheetId}/permissions`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ role: 'writer', type: 'user', emailAddress: targetEmail })
        });

        // Add Headers
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentSheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [["No Kunjungan", "Tanggal", "Jam", "Nama", "Instansi", "Jabatan", "No HP", "Email", "Keperluan", "Tujuan Bertemu", "Bidang Tujuan", "Peserta", "Keterangan Lainnya", "Foto Pengunjung (Drive)", "Tanda Tangan (Drive)"]]
          })
        });
      }

      // 2. Create Drive Folder if not exists
      if (!driveFolderId) {
        const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: "Data Tamu BPMP",
            mimeType: "application/vnd.google-apps.folder"
          })
        });
        
        if (folderRes.ok) {
          const folderData = await folderRes.json();
          driveFolderId = folderData.id;
          if (driveFolderId) localStorage.setItem('bpmp_drive_folder_id', driveFolderId);
          
          // Make folder public so spreadsheet viewers can see the image thumbnails
          await fetch(`https://www.googleapis.com/drive/v3/files/${driveFolderId}/permissions`, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ role: 'reader', type: 'anyone' })
          });
          const targetEmail = localStorage.getItem('bpmp_target_email') || 'bpmplpg@gmail.com';
          // Also share explicitly with the requested email
          await fetch(`https://www.googleapis.com/drive/v3/files/${driveFolderId}/permissions`, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ role: 'writer', type: 'user', emailAddress: targetEmail })
          });
        }
      }

      // 3. Upload files to drive and append to sheets
      const values = [];

      for (const v of unsynced) {
         let photoUrl = "";
         let signatureUrl = "";

         if (v.photoUrl && driveFolderId) {
           photoUrl = await uploadToDrive(v.photoUrl, `Foto_${v.visitNumber}.jpg`, driveFolderId, googleAccessToken);
         }
         if (v.signatureUrl && driveFolderId) {
           signatureUrl = await uploadToDrive(v.signatureUrl, `Ttd_${v.visitNumber}.png`, driveFolderId, googleAccessToken);
         }

         values.push([
           v.visitNumber, 
           v.tanggalKunjungan, 
           v.jamDatang, 
           v.namaLengkap, 
           v.instansi, 
           v.jabatan, 
           v.noHp, 
           v.email, 
           v.keperluan, 
           v.tujuanBertemu, 
           v.bidangTujuan, 
           v.jumlahPengunjung,
           v.keteranganLainnya || '',
           photoUrl,
           signatureUrl
         ]);
      }

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentSheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan ke Google Sheets");
      }

      // Mark as synced in backend
      const idsToMark = unsynced.map(v => v.id);
      await fetch('/api/admin/visits/mark-synced', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: idsToMark })
      });

      if (!passedUnsynced) alert("Berhasil disinkronisasi ke Google Sheets dan Drive secara otomatis.");
      fetchData(); // reload
    } catch (err) {
      console.error(err);
      if (!passedUnsynced) alert("Gagal sinkron. Pastikan Anda memiliki akses atau coba Login ulang Google.");
    } finally {
      setSyncing(false);
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Tamu');
    
    sheet.columns = [
      { header: 'No Kunjungan', key: 'visitNumber', width: 20 },
      { header: 'Tanggal', key: 'tanggalKunjungan', width: 15 },
      { header: 'Jam', key: 'jamDatang', width: 10 },
      { header: 'Nama', key: 'namaLengkap', width: 25 },
      { header: 'Instansi', key: 'instansi', width: 25 },
      { header: 'Keperluan', key: 'keperluan', width: 20 },
      { header: 'Tujuan Bertemu', key: 'tujuanBertemu', width: 20 },
    ];

    data.forEach(v => {
      sheet.addRow(v);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Tamu_BPMP_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = data.filter(v => v.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) || v.instansi.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {!googleAccessToken && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium">Anda perlu menghubungkan akun Google untuk Sinkronisasi ke Spreadsheet dan Drive.</p>
          <button onClick={handleLogin} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-300">Hubungkan Google</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Data Tamu</h1>
        <div className="flex items-center gap-3">
          <button onClick={toggleAutoSync} className={`flex items-center gap-2 border px-4 py-2 rounded-lg font-medium transition shadow-sm text-sm ${autoSync ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {autoSync ? <ToggleRight className="w-4 h-4 text-blue-600"/> : <ToggleLeft className="w-4 h-4 text-gray-400"/>}
            Auto-Sync {autoSync ? 'On' : 'Off'}
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition shadow-sm text-sm">
            <Download className="w-4 h-4"/> Export Excel
          </button>
          <button onClick={() => handleSyncToSheets()} disabled={syncing || filteredData.length === 0} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm text-sm">
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4"/>} 
            Sync ke G-Sheets ({data.filter(d => !d.syncedToSheets).length})
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Nama atau Instansi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search className="w-4 h-4"/></div>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 w-full rounded-lg border-gray-300 border bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ketik kata kunci..." />
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Spreadsheet ID</label>
            <div className="flex gap-2">
              <input type="text" value={spreadsheetId} disabled={!isEditingSheetId} onChange={e => setSpreadsheetId(e.target.value)} className="w-full rounded-lg border-gray-300 border bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100" placeholder="ID dari URL Google Sheets..." />
              {isEditingSheetId ? (
                <button onClick={saveSheetId} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
              ) : (
                <>
                  <button onClick={() => setIsEditingSheetId(true)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">Edit</button>
                  {spreadsheetId && (
                    <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                      Buka
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">No Kunjungan</th>
                <th className="px-6 py-4">Tanggal & Jam</th>
                <th className="px-6 py-4">Tamu</th>
                <th className="px-6 py-4">Asal/Instansi</th>
                <th className="px-6 py-4">Keperluan</th>
                <th className="px-6 py-4">Tujuan</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Tidak ada data tamu.</td></tr>
              ) : (
                filteredData.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{v.visitNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">{v.tanggalKunjungan}</div>
                      <div className="text-gray-500 text-xs">{v.jamDatang}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{v.namaLengkap}</div>
                      <div className="text-gray-500 text-xs">{v.noHp}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{v.instansi}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {v.keperluan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{v.tujuanBertemu}</div>
                      <div className="text-gray-500 text-xs">{v.bidangTujuan}</div>
                    </td>
                    <td className="px-6 py-4">
                      {v.syncedToSheets ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Synced</span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-amber-600">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Add this inline to avoid another import
function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
}
