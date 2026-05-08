import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.get('/logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.asset_name?.toLowerCase().includes(search.toLowerCase()) || 
                          log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
                          log.asset_id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesType = filterType === 'all' || log.asset_type === filterType;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (logDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesAction && matchesType && matchesDate;
  });

  const uniqueTypes = Array.from(new Set(logs.map(l => l.asset_type).filter(Boolean))).sort();

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Báo cáo Lịch sử sử dụng Thiết bị - FPT Poly ĐN', 14, 15);
    
    const tableColumn = ["Mã QA", "Tên thiết bị", "Hành động", "Người thực hiện", "Thời gian", "Ghi chú"];
    const tableRows = filteredLogs.map(log => [
      log.asset_id,
      log.asset_name,
      log.action === 'checkout' ? 'Mượn' :
      log.action === 'checkin' ? 'Trả' :
      log.action === 'report-broken' ? 'Báo hỏng' : 
      log.action === 'maintenance' ? 'Bảo trì' : 'Sẵn sàng',
      log.user_name,
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm'),
      log.notes || ''
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save(`Bao_cao_thiet_bi_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
      'Mã QA': log.asset_id,
      'Tên thiết bị': log.asset_name,
      'Hành động': log.action === 'checkout' ? 'Mượn' :
                   log.action === 'checkin' ? 'Trả' :
                   log.action === 'report-broken' ? 'Báo hỏng' : 
                   log.action === 'maintenance' ? 'Bảo trì' : 'Sẵn sàng',
      'Người thực hiện': log.user_name,
      'Thời gian': format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm'),
      'Ghi chú': log.notes || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lịch sử");
    XLSX.writeFile(wb, `Bao_cao_thiet_bi_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Lịch sử sử dụng</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportPDF} className="dark:bg-slate-800 dark:border-slate-700 transition-all">
            <Download className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
          <Button variant="outline" onClick={exportExcel} className="dark:bg-slate-800 dark:border-slate-700 transition-all">
            <Download className="mr-2 h-4 w-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm theo mã QA, tên thiết bị hoặc người thực hiện..." 
                className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all h-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="checkout">Mượn (Check-out)</SelectItem>
                <SelectItem value="checkin">Trả (Check-in)</SelectItem>
                <SelectItem value="report-broken">Báo hỏng</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
                <SelectItem value="update">Cập nhật</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Loại thiết bị" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="all">Tất cả loại</SelectItem>
                {uniqueTypes.map(t => <SelectItem key={t as string} value={t as string}>{t as string}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="w-full sm:w-[140px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
              <span className="text-slate-500">-</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="w-full sm:w-[140px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow className="dark:border-slate-800">
                <TableHead className="font-bold dark:text-slate-300">Mã QA</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Tên thiết bị</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Hành động</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Người thực hiện</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Thời gian</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-primary/80">{log.asset_id}</TableCell>
                  <TableCell className="font-medium dark:text-slate-200">{log.asset_name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      log.action === 'checkout' ? 'default' :
                      log.action === 'checkin' ? 'secondary' :
                      log.action === 'report-broken' ? 'destructive' : 'outline'
                    } className="font-bold">
                      {log.action === 'checkout' ? 'Mượn' :
                       log.action === 'checkin' ? 'Trả' :
                       log.action === 'report-broken' ? 'Báo hỏng' : 
                       log.action === 'maintenance' ? 'Bảo trì' : 
                       log.action === 'update' ? 'Cập nhật' : 'Sẵn sàng'}
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:text-slate-300">{log.user_name}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell className="max-w-[200px] truncate dark:text-slate-500" title={log.notes}>{log.notes || '-'}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy lịch sử nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
