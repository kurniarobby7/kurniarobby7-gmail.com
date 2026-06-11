import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GuestForm from './components/GuestForm.tsx';
import AdminDashboard from './components/Admin/AdminDashboard.tsx';
import AdminDataList from './components/Admin/AdminDataList.tsx';
import AdminLayout from './components/Admin/AdminLayout.tsx';
import AdminSettings from './components/Admin/AdminSettings.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GuestForm />} />
        
        {/* Admin Routes wrapped in a layout for sidebar/navbar */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="data" element={<AdminDataList />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

