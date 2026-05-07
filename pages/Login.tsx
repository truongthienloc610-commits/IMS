import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        animate={isError ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className={isError ? 'border-red-500 shadow-lg shadow-red-100' : ''}>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/20/FPT_Polytechnic.png" 
                alt="FPT Polytechnic" 
                className="h-16"
                referrerPolicy="no-referrer"
              />
            </div>
            <CardTitle className="text-2xl">{isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập'}</CardTitle>
            <CardDescription>
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
                <Label htmlFor="email">Email (@fpt.edu.vn)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="user@fpt.edu.vn" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={isError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={isError ? 'border-red-500 focus-visible:ring-red-500' : ''}
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
