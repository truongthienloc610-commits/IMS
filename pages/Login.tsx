import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';

import { PartyPopper, X, Sun, Moon } from 'lucide-react';

export default function Login({ 
  onLogin, 
  theme, 
  onToggleTheme 
}: { 
  onLogin: (user: any) => void,
  theme?: 'light' | 'dark',
  onToggleTheme?: () => void
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith('@fpt.edu.vn');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error('Email phải có đuôi @fpt.edu.vn');
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    try {
      if (isRegistering) {
        const res = await api.post('/auth/register', { 
          email, 
          password, 
          name, 
          staff_code: staffCode 
        });
        toast.success(res.message || 'Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt tài khoản của bạn.');
        setIsRegistering(false);
        setPassword('');
      } else {
        const res = await api.post('/auth/login', { email, password });
        onLogin(res.user);
        toast.success('Đăng nhập thành công');
      }
    } catch (err: any) {
      setIsError(true);
      let errorMessage = 'Đã có lỗi xảy ra';
      
      try {
        // Try to parse JSON error from server
        const parsedError = JSON.parse(err.message);
        errorMessage = parsedError.error || errorMessage;
      } catch (e) {
        errorMessage = err.message || errorMessage;
      }
      
      toast.error(errorMessage);
      
      if (!isRegistering && (errorMessage.toLowerCase().includes('không tồn tại') || errorMessage.toLowerCase().includes('invalid credentials'))) {
        toast.info('Nếu bạn chưa có tài khoản, vui lòng chuyển sang Đăng ký');
      }

      setTimeout(() => setIsError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* YouTube Background Video */}
      <div className="absolute inset-0 z-0 scale-110 pointer-events-none opacity-40">
        <iframe 
          className="w-full h-full"
          src="https://www.youtube-nocookie.com/embed/6ezgcBs8HFo?autoplay=1&mute=1&controls=0&loop=1&playlist=6ezgcBs8HFo&rel=0&showinfo=0&iv_load_policy=3&start=6" 
          frameBorder="0" 
          allow="autoplay; encrypted-media" 
          allowFullScreen
        ></iframe>
        {/* Deep Blur Overlay - Changes based on theme */}
        <div className={`absolute inset-0 transition-all duration-700 ${
          theme === 'dark' ? 'bg-black/70 backdrop-blur-[6px]' : 'bg-slate-500/30 backdrop-blur-[10px]'
        }`} />
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleTheme} 
          className={`rounded-full shadow-lg backdrop-blur-md border ${
            theme === 'dark' 
              ? 'bg-white/10 border-white/20 hover:bg-white/20' 
              : 'bg-black/5 border-black/10 hover:bg-black/10'
          }`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isError ? { x: [-10, 10, -10, 10, 0], opacity: 1, y: 0 } : { x: 0, opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className={`${isError ? 'border-red-500 shadow-md' : ''} 
          ${theme === 'dark' 
            ? 'bg-white/5 border-white/10 text-white shadow-2xl shadow-black/20 backdrop-blur-xl' 
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'} 
          border transition-all duration-500`}>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
                alt="FPT Polytechnic" 
                className="h-16 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <CardTitle className={`text-2xl transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập'}
            </CardTitle>
            <CardDescription className={theme === 'dark' ? 'text-white/60' : 'text-slate-500'}>
              Hệ thống quản lý cơ sở hạ tầng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input 
                      id="name" 
                      placeholder="Nguyễn Văn A" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffCode">Mã nhân viên/giảng viên</Label>
                    <Input 
                      id="staffCode" 
                      placeholder="Ví dụ: GV123, FE456" 
                      value={staffCode}
                      onChange={(e) => setStaffCode(e.target.value)}
                      required 
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      * Chỉ dành cho giảng viên/nhân viên FPT (Mã bắt đầu bằng GV, FE, NV)
                    </p>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className={theme === 'dark' ? 'text-white/80' : 'text-slate-700'}>Email (@fpt.edu.vn)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="user@fpt.edu.vn" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${isError ? 'border-red-500 focus-visible:ring-red-500' : (theme === 'dark' ? 'border-white/5' : 'border-slate-200')} 
                    ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-white/20' : 'bg-slate-50 text-slate-900'} transition-all`}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={theme === 'dark' ? 'text-white/80' : 'text-slate-700'}>Mật khẩu</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${isError ? 'border-red-500 focus-visible:ring-red-500' : (theme === 'dark' ? 'border-white/5' : 'border-slate-200')} 
                    ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-50 text-slate-900'} transition-all`}
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : (isRegistering ? 'Đăng ký' : 'Đăng nhập')}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-primary hover:underline"
              >
                {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
              </button>
            </div>

            {!isRegistering && (
              <div className="mt-4 text-center text-xs text-muted-foreground border-t pt-4">
                <p>Tài khoản demo: admin@fpt.edu.vn / admin123</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
