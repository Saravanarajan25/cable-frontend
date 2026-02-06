import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePayments } from '@/hooks/usePayments';
import { Home, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [stats, setStats] = useState({
    totalHomes: 0,
    paidCount: 0,
    unpaidCount: 0,
    collectedAmount: 0,
    pendingAmount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const { getMonthlyStats } = usePayments();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const data = await getMonthlyStats(currentMonth, currentYear);
      setStats(data);
      setLoadingStats(false);
    };

    fetchStats();

    // Refresh stats when page becomes visible (user returns to dashboard)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, currentMonth, currentYear, getMonthlyStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/search?homeId=${searchId.trim()}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-primary text-primary-foreground rounded-xl p-6">
          <h1 className="text-2xl font-bold">Welcome, Cable Operator!</h1>
          <p className="text-primary-foreground/80 mt-1">
            {monthName} {currentYear} - Payment Collection Dashboard
          </p>
        </div>

        {/* Stats Cards */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Homes"
            value={loadingStats ? '...' : stats.totalHomes}
            icon={Home}
            variant="default"
          />
          <StatCard
            title="Paid This Month"
            value={loadingStats ? '...' : stats.paidCount}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Unpaid This Month"
            value={loadingStats ? '...' : stats.unpaidCount}
            icon={XCircle}
            variant="destructive"
          />
        </div>

        {/* Quick Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Quick Search by Home ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter Home ID (e.g., 40)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 h-12 text-lg"
                min="1"
              />
              <Button type="submit" className="h-12 px-8" disabled={!searchId.trim()}>
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 text-lg"
            onClick={() => navigate('/reports?status=paid')}
          >
            <CheckCircle className="w-6 h-6 mr-2 text-success" />
            View Paid Homes
          </Button>
          <Button
            variant="outline"
            className="h-16 text-lg"
            onClick={() => navigate('/reports?status=unpaid')}
          >
            <XCircle className="w-6 h-6 mr-2 text-destructive" />
            View Unpaid Homes
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
