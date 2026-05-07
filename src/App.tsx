/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Assets from '@/pages/Assets';
import AssetBoard from '@/pages/AssetBoard';
import Scanner from '@/pages/Scanner';
import Logs from '@/pages/Logs';
import BuildingMap from '@/pages/BuildingMap';
import Users from '@/pages/Users';
import Repairs from '@/pages/Repairs';

import CampusMap from '@/pages/CampusMap';

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Assets user={user} />} />
            <Route path="/lessons" element={<AssetBoard user={user} />} />
            <Route path="/students" element={<Scanner user={user} />} />
            <Route path="/map" element={<BuildingMap />} />
            <Route path="/exams" element={<Logs />} />
            <Route path="/campus-3d" element={<CampusMap />} />
            <Route path="/reports" element={<Repairs user={user} />} />
            <Route path="/settings" element={<Users user={user} />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-muted-foreground mt-2">Không tìm thấy trang yêu cầu.</p>
                <Link to="/dashboard" className="mt-4 text-primary hover:underline">Quay lại Tổng quan</Link>
              </div>
            } />
          </Routes>
        </Layout>
      </TooltipProvider>
      <Toaster />
    </BrowserRouter>
  );
}
