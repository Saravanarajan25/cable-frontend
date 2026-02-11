import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import PaymentStatusBadge from '@/components/PaymentStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments } from '@/hooks/usePayments';
import { Calendar, Download, Loader2, FileSpreadsheet } from 'lucide-react';

interface HomeWithPayment {
  id: string;
  home_id: number;
  customer_name: string;
  phone: string;
  set_top_box_id: string;
  monthly_amount: number;
  payment_status: 'paid' | 'unpaid';
  paid_date: string | null;
}

const ReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as 'paid' | 'unpaid' | 'all' || 'all';

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [status, setStatus] = useState<'paid' | 'unpaid' | 'all'>(initialStatus);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [homes, setHomes] = useState<HomeWithPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const { getPaymentsByMonthYear } = usePayments();

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i);

  useEffect(() => {
    fetchData();
  }, [month, year, status, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    const statusFilter = status === 'all' ? undefined : status;
    const data = await getPaymentsByMonthYear(month, year, statusFilter, fromDate, toDate);
    setHomes(data as HomeWithPayment[]);
    setLoading(false);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as 'paid' | 'unpaid' | 'all');
    if (value !== 'all') {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      const monthName = months.find(m => m.value === month)?.label || '';
      // Fallback filename if header is missing
      let fileName = `Cable_Payments_${monthName}_${year}_${status.toUpperCase()}.xlsx`;

      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
        status: status,
      });

      // Robust URL construction
      const baseUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, '') || '';
      const exportUrl = `${baseUrl}/api/export/excel?${params.toString()}`;

      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please login to export.');
        window.location.href = '/auth';
        return;
      }

      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          window.location.href = '/auth';
          return;
        }
        if (response.status === 404) {
          throw new Error('Export endpoint not found. Check VITE_BACKEND_URL.');
        }
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Try to get filename from header
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter homes based on search query
  const filteredHomes = homes.filter(home => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      home.customer_name.toLowerCase().includes(query) ||
      home.home_id.toString().includes(query) ||
      home.phone.includes(query)
    );
  });

  const paidCount = homes.filter(h => h.payment_status === 'paid').length;
  const unpaidCount = homes.filter(h => h.payment_status === 'unpaid').length;
  // const totalAmount = homes.reduce((sum, h) => sum + h.monthly_amount, 0); // Not used in display
  const collectedAmount = homes
    .filter(h => h.payment_status === 'paid')
    .reduce((sum, h) => sum + h.monthly_amount, 0);

  const pendingAmount = homes
    .filter(h => h.payment_status === 'unpaid')
    .reduce((sum, h) => sum + h.monthly_amount, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Payment Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status Filter</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Homes</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                    <SelectItem value="unpaid">Unpaid Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <input
                  type="date"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <input
                  type="date"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              {/* New Search Bar */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <input
                  type="text"
                  placeholder="Name, ID, Phone..."
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Homes</p>
              <p className="text-2xl font-bold">{homes.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-success">{paidCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Unpaid</p>
              <p className="text-2xl font-bold text-destructive">{unpaidCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold">₹{collectedAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button onClick={exportToExcel} disabled={homes.length === 0 || loading} className="h-12">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Export to Excel
          </Button>
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredHomes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No homes found for the selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Home ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="hidden md:table-cell">STB ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHomes.map((home) => (
                      <TableRow key={home.id}>
                        <TableCell className="font-medium">{home.home_id}</TableCell>
                        <TableCell>{home.customer_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{home.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">{home.set_top_box_id}</TableCell>
                        <TableCell className="text-right">₹{home.monthly_amount}</TableCell>
                        <TableCell className="text-center">
                          <PaymentStatusBadge status={home.payment_status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportsPage;
