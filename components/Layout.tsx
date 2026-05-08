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
  Wrench,
  PartyPopper,
  Sparkles,
  X,
  Sun,
  Moon
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { getCurrentEvent } from '@/lib/events';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from './LoadingScreen';

export default function Layout({ 
  children, 
  user, 
  onLogout,
  theme,
  onToggleTheme
}: { 
  children: React.ReactNode, 
  user: any, 
  onLogout: () => void,
  theme?: 'light' | 'dark',
  onToggleTheme?: () => void
}) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    // Show loading screen on page change
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800); // Short duration for page transitions
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const event = getCurrentEvent();
    setActiveEvent(event);

    if (event) {
      // Check if already shown in this session
      const hasShown = sessionStorage.getItem(`event_shown_${event.id}`);
      if (!hasShown) {
        setShowAnnouncement(true);
        triggerFireworks();
        sessionStorage.setItem(`event_shown_${event.id}`, 'true');
      }
    }
  }, []);

  const triggerFireworks = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

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
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary/20 transition-colors duration-500 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 flex justify-between items-center shrink-0 z-50">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
          alt="FPT Polytechnic" 
          className="h-10 object-contain"
          referrerPolicy="no-referrer"
        />
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onToggleTheme} className="rounded-full">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-white dark:bg-black border-r border-slate-200 dark:border-slate-800 transition-colors">
        <div className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
          <div className="flex items-center justify-center py-6">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
              alt="FPT Polytechnic" 
              className="h-12 transition-all object-contain" 
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 text-center">Quản lý hệ thống cơ sở hạ tầng</p>
        </div>

        <div className="p-4 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-black tracking-widest">{user.role}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggleTheme} className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-90">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </Button>
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
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={onLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col relative overflow-hidden ${activeEvent?.themeClass || ''}`}>
        {/* Background Watermark for Events */}
        {activeEvent && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] select-none z-0">
            {activeEvent.imageUrl ? (
              <div className="w-full h-full relative">
                <img 
                  src={activeEvent.imageUrl} 
                  alt={activeEvent.name}
                  className="w-full h-full object-cover filter grayscale blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 {activeEvent.id === 'new-year' ? (
                    <Sparkles className="w-[600px] h-[600px] text-primary" />
                  ) : (
                    <PartyPopper className="w-[600px] h-[600px] text-primary" />
                  )}
                  <h1 className="text-8xl font-black uppercase mt-10 text-center leading-none tracking-tighter text-primary">
                    {activeEvent.name}
                  </h1>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8 relative z-10 bg-slate-50 dark:bg-black transition-colors">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-40 transition-colors shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center space-y-1 ${
              location.pathname === item.path ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Holiday Announcement Modal */}
      <AnimatePresence>
        {showAnnouncement && activeEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden border-4 border-primary"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                <PartyPopper size={120} className="text-primary" />
              </div>

              <button 
                onClick={() => setShowAnnouncement(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 text-center">
                <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
                  <PartyPopper size={48} className="text-primary animate-bounce" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-tight">
                  {activeEvent.name}
                </h2>
                
                <div className="w-20 h-1.5 bg-primary mx-auto mb-6 rounded-full" />
                
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8 italic">
                  "{activeEvent.announcement || 'Chúc mừng ngày lễ lớn của dân tộc!'}"
                </p>

                <Button 
                  onClick={() => setShowAnnouncement(false)}
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                  Bắt đầu làm việc
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Transition Loading Screen */}
      <AnimatePresence>
        {isPageLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999]"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
