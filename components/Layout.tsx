import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ClipboardList, 
  LogOut, 
  Menu,
  Map,
  Box,
  Smartphone,
  Layers,
  Wrench
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';

export default function Layout({ children, user, onLogout }: { children: React.ReactNode, user: any, onLogout: () => void }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  interface NavItem {
    path: string;
    label: string;
    icon: any;
    roles: string[];
    permission?: string;
  }

  const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    { path: '/courses', label: 'Danh sách thiết bị', icon: Box, roles: ['admin', 'staff'] },
    { path: '/lessons', label: 'Mượn/Trả thiết bị', icon: ClipboardList, roles: ['admin', 'staff'] },
    { path: '/students', label: 'Quét mã QR', icon: Smartphone, roles: ['admin', 'staff'] },
    { path: '/map', label: 'Sơ đồ tòa nhà', icon: Map, roles: ['admin', 'staff'] },
    { path: '/campus-3d', label: 'Mô hình Campus', icon: Layers, roles: ['admin', 'staff'] },
    { path: '/exams', label: 'Lịch sử sử dụng', icon: ClipboardList, roles: ['admin', 'staff'] },
    { path: '/reports', label: 'Bảo trì & Sửa chữa', icon: Wrench, roles: ['admin', 'staff'] },
    { path: '/settings', label: 'Quản lý người dùng', icon: Users, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (user.role === 'admin') return true;
    if (item.permission && !user[item.permission]) return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
          alt="FPT Polytechnic" 
          className="h-8"
          referrerPolicy="no-referrer"
        />
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white border-r flex flex-col`}>
        <div className="p-6 hidden md:block">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
            alt="FPT Polytechnic" 
            className="w-full mb-2"
            referrerPolicy="no-referrer"
          />
          <div className="text-sm text-muted-foreground mt-1">Quản lý hệ thống cơ sở hạ tầng</div>
        </div>
        
        <div className="px-4 py-2 border-t md:border-t-0">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-2 z-50 shadow-lg">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-md transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-500'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
