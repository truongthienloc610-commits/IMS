import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Trash2, Lock, Unlock, UserCheck, UserX, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

export default function Users({ user: currentUser }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [permissionUser, setPermissionUser] = useState<any>(null);
  const [permissions, setPermissions] = useState({
    can_borrow: false,
    can_repair: false,
    can_manage_users: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách người dùng');
    }
  };

  const handleToggleLock = async (userId: number, currentLockStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}/lock`, { is_locked: !currentLockStatus });
      toast.success(currentLockStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleApprove = async (userId: number, currentApproveStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}/approve`, { is_approved: !currentApproveStatus });
      toast.success(currentApproveStatus ? 'Đã hủy phê duyệt tài khoản' : 'Đã phê duyệt tài khoản');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await api.delete(`/users/${deleteUserId}`);
      toast.success('Đã xóa người dùng');
      setDeleteUserId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openPermissions = (user: any) => {
    setPermissionUser(user);
    setPermissions({
      can_borrow: !!user.can_borrow,
      can_repair: !!user.can_repair,
      can_manage_users: !!user.can_manage_users
    });
  };

  const handleUpdatePermissions = async () => {
    if (!permissionUser) return;
    try {
      await api.patch(`/users/${permissionUser.id}/permissions`, permissions);
      toast.success('Cập nhật quyền hạn thành công');
      setPermissionUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    return (u.name?.toLowerCase() || '').includes(searchLower) || 
           (u.email?.toLowerCase() || '').includes(searchLower) ||
           (u.staff_code?.toLowerCase() || '').includes(searchLower);
  });

  if (currentUser.role !== 'admin' && !currentUser.can_manage_users) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-xl font-semibold text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Quản lý người dùng</h1>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm theo tên, email hoặc mã nhân viên..." 
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mã NV/GV</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.staff_code || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.is_approved ? (
                      u.is_locked ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                          <UserX className="h-3 w-3" /> Đã khóa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex w-fit items-center gap-1 text-green-600 border-green-200 bg-green-50">
                          <UserCheck className="h-3 w-3" /> Hoạt động
                        </Badge>
                      )
                    ) : (
                      <Badge variant="secondary" className="flex w-fit items-center gap-1 text-amber-600 border-amber-200 bg-amber-50">
                        <Clock className="h-3 w-3" /> Chờ duyệt
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(u.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {u.id !== currentUser.id && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleToggleApprove(u.id, !!u.is_approved)}
                          title={u.is_approved ? "Hủy phê duyệt" : "Phê duyệt"}
                          className={u.is_approved ? "text-amber-600" : "text-green-600"}
                        >
                          {u.is_approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => openPermissions(u)}
                          title="Phân quyền"
                          className="text-blue-600"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleToggleLock(u.id, !!u.is_locked)}
                          title={u.is_locked ? "Mở khóa" : "Khóa tài khoản"}
                          className={u.is_locked ? "text-green-600" : "text-orange-600"}
                        >
                          {u.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700" 
                          onClick={() => setDeleteUserId(u.id)}
                          title="Xóa người dùng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Không tìm thấy người dùng nào
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!permissionUser} onOpenChange={(open) => !open && setPermissionUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phân quyền người dùng: {permissionUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="can_borrow" className="flex flex-col space-y-1">
                <span>Quyền mượn/trả thiết bị</span>
                <span className="font-normal text-xs text-muted-foreground">Cho phép người dùng thực hiện checkout/checkin thiết bị.</span>
              </Label>
              <input 
                id="can_borrow"
                type="checkbox" 
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                checked={permissions.can_borrow}
                onChange={e => setPermissions({...permissions, can_borrow: e.target.checked})}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="can_repair" className="flex flex-col space-y-1">
                <span>Quyền quản lý sửa chữa</span>
                <span className="font-normal text-xs text-muted-foreground">Cho phép gửi yêu cầu sửa chữa và cập nhật trạng thái bảo trì.</span>
              </Label>
              <input 
                id="can_repair"
                type="checkbox" 
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                checked={permissions.can_repair}
                onChange={e => setPermissions({...permissions, can_repair: e.target.checked})}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="can_manage_users" className="flex flex-col space-y-1">
                <span>Quyền quản lý người dùng</span>
                <span className="font-normal text-xs text-muted-foreground">Cho phép truy cập trang quản lý người dùng và phân quyền.</span>
              </Label>
              <input 
                id="can_manage_users"
                type="checkbox" 
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                checked={permissions.can_manage_users}
                onChange={e => setPermissions({...permissions, can_manage_users: e.target.checked})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPermissionUser(null)}>Hủy</Button>
            <Button onClick={handleUpdatePermissions}>Lưu thay đổi</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa người dùng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
