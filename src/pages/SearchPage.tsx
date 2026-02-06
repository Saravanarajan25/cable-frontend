import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomeCard from '@/components/HomeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHomes, Home } from '@/hooks/useHomes';
import { usePayments, Payment } from '@/hooks/usePayments';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialHomeId = searchParams.get('homeId') || '';

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [searchId, setSearchId] = useState(initialHomeId);
  const [searchedHome, setSearchedHome] = useState<Home | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<Payment | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Month/Year Selection State
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customer_name: '',
    phone: '',
    set_top_box_id: '',
    monthly_amount: 0
  });

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { searchHomeById, updateHome, deleteHome, loading: homeLoading } = useHomes();
  const { getPaymentStatus, markAsPaid, markAsUnpaid, loading: paymentLoading } = usePayments();

  // Create formatted month name for the HomeCard display (dynamic based on selection)
  // Assuming monthName logic was just for display.
  // We need to construct a date object or just array lookup for the label if HomeCard needs a string.
  // HomeCard prop is `currentMonth`.
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

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i); // Last year to +4 years

  const displayMonthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (initialHomeId) {
      handleSearch(initialHomeId);
    }
  }, []);

  // Refetch payment status when month/year changes if a home is already loaded
  useEffect(() => {
    const fetchStatus = async () => {
      if (searchedHome) {
        const payment = await getPaymentStatus(searchedHome.home_id, selectedMonth, selectedYear);
        setPaymentStatus(payment);
      }
    };
    fetchStatus();
  }, [selectedMonth, selectedYear, searchedHome?.home_id]); // Depend on ID to avoid loop if object ref changes but ID matches

  const handleSearch = async (id?: string) => {
    const homeId = parseInt(id || searchId);
    if (isNaN(homeId)) return;

    setSearching(true);
    setNotFound(false);
    setSearchedHome(null);
    setPaymentStatus(null);

    // Reset selection to current month on new search? 
    // Maybe keep user selection if they are doing bulk entry for Jan?
    // Let's keep the selection. It's more useful for batch work.

    const home = await searchHomeById(homeId);

    if (home) {
      setSearchedHome(home);
      // Payment status fetch triggered by useEffect now
    } else {
      setNotFound(true);
    }

    setSearching(false);
  };

  const handleMarkAsPaid = async () => {
    if (!searchedHome) return;
    const result = await markAsPaid(searchedHome.home_id, selectedMonth, selectedYear);
    if (result) {
      setPaymentStatus(result as Payment);
    }
  };

  const handleMarkAsUnpaid = async () => {
    if (!searchedHome) return;
    const result = await markAsUnpaid(searchedHome.home_id, selectedMonth, selectedYear);
    if (result) {
      setPaymentStatus(result as Payment);
    }
  };

  const handleEditClick = () => {
    if (searchedHome) {
      setEditFormData({
        customer_name: searchedHome.customer_name,
        phone: searchedHome.phone,
        set_top_box_id: searchedHome.set_top_box_id,
        monthly_amount: searchedHome.monthly_amount
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdate = async () => {
    if (searchedHome) {
      const updated = await updateHome(searchedHome.home_id, editFormData);
      if (updated) {
        setSearchedHome(updated);
        setIsEditDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (searchedHome) {
      const success = await deleteHome(searchedHome.home_id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSearchedHome(null);
        setSearchId('');
        navigate('/search');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Home by ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter Home ID (e.g., 40)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 h-14 text-xl"
                min="1"
              />
              <Button
                type="submit"
                className="h-14 px-8 text-lg"
                disabled={!searchId.trim() || searching}
              >
                {searching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Month/Year Selection Area */}
        {searchedHome && !searching && (
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="h-12 bg-card">
                  <SelectValue placeholder="Select Month" />
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
            <div className="w-1/3">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="h-12 bg-card">
                  <SelectValue placeholder="Select Year" />
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
          </div>
        )}

        {searching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {notFound && !searching && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Home Not Found</h3>
              <p className="text-muted-foreground mt-2">
                No home found with ID "{searchId}". Please check the ID and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {searchedHome && !searching && (
          <HomeCard
            homeId={searchedHome.home_id}
            customerName={searchedHome.customer_name}
            phone={searchedHome.phone}
            setTopBoxId={searchedHome.set_top_box_id}
            monthlyAmount={searchedHome.monthly_amount}
            paymentStatus={paymentStatus?.status || 'unpaid'}
            paidDate={paymentStatus?.paid_date || null}
            onMarkAsPaid={handleMarkAsPaid}
            onMarkAsUnpaid={handleMarkAsUnpaid}
            onEdit={handleEditClick}
            onDelete={() => setIsDeleteDialogOpen(true)}
            loading={paymentLoading || homeLoading}
            currentMonth={displayMonthName}
          />
        )}

        {/* Edit Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Customer Details</DialogTitle>
              <DialogDescription>
                Update information for Home #{searchedHome?.home_id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={editFormData.customer_name}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stb">Set-Top Box ID</Label>
                <Input
                  id="stb"
                  value={editFormData.set_top_box_id}
                  onChange={(e) => setEditFormData({ ...editFormData, set_top_box_id: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Monthly Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={editFormData.monthly_amount}
                  onChange={(e) => setEditFormData({ ...editFormData, monthly_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={homeLoading}>
                {homeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete Home #{searchedHome?.home_id} and all related payments? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={homeLoading}>
                {homeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SearchPage;
