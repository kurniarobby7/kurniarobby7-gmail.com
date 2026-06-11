import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useOutletContext<{ token: string }>();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/visits', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      // Calculate stats locally for simple app
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = data.filter((v:any) => v.tanggalKunjungan === today)
                              .reduce((acc: number, v:any) => acc + (parseInt(v.jumlahPengunjung, 10) || 1), 0);
      const totalVisits = data.reduce((acc: number, v:any) => acc + (parseInt(v.jumlahPengunjung, 10) || 1), 0);

      // Group by keperluan
      const keperluanMap: Record<string, number> = {};
      data.forEach((v:any) => {
        keperluanMap[v.keperluan] = (keperluanMap[v.keperluan] || 0) + (parseInt(v.jumlahPengunjung, 10) || 1);
      });
      const keperluanData = Object.keys(keperluanMap).map(k => ({ name: k, value: keperluanMap[k] }));

      // Group by date for chart (last 7 days approx)
      const dateMap: Pick<any, any> = {};
      data.forEach((v:any) => {
        dateMap[v.tanggalKunjungan] = (dateMap[v.tanggalKunjungan] || 0) + (parseInt(v.jumlahPengunjung, 10) || 1);
      });
      const dateData = Object.keys(dateMap).sort().slice(-7).map(d => ({ date: d, count: dateMap[d] }));

      setStats({
        todayVisits,
        totalVisits,
        keperluanData,
        dateData
      });
    });
  }, [token]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6"/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Tamu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Calendar className="w-6 h-6"/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tamu Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayVisits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp className="w-6 h-6"/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Kategori Terbanyak</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {stats.keperluanData.length > 0 ? stats.keperluanData.sort((a:any,b:any)=>b.value-a.value)[0].name : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Grafik Kunjungan (7 Hari)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Statistik Keperluan</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.keperluanData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.keperluanData.map((_entry:any, index:number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
