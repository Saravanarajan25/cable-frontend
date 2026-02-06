import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  home_id: number;
  month: number;
  year: number;
  status: 'paid' | 'unpaid';
  paid_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithHome extends Payment {
  homes: {
    customer_name: string;
    phone: string;
    set_top_box_id: string;
    monthly_amount: number;
  };
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getPaymentStatus = useCallback(async (homeId: number, month: number, year: number): Promise<Payment | null> => {
    try {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });
      const data = await apiClient.get(`/payments/status/${homeId}?${params.toString()}`);

      // Backend returns either the payment record or { status: 'unpaid', ... }
      // Map it to our Payment interface
      return {
        id: data.id || '',
        home_id: homeId,
        month: data.month || month,
        year: data.year || year,
        status: data.status,
        paid_date: data.paid_date,
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      };
    } catch (error: any) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  }, []);

  const markAsPaid = useCallback(async (homeId: number, month: number, year: number) => {
    setLoading(true);
    try {
      const data = await apiClient.post('/payments/mark-paid', {
        home_id: homeId,
        month,
        year
      });
      return data as Payment;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to mark payment.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const markAsUnpaid = useCallback(async (homeId: number, month: number, year: number) => {
    setLoading(true);
    try {
      const data = await apiClient.put('/payments/mark-unpaid', {
        home_id: homeId,
        month,
        year
      });
      return data as Payment;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update payment.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPaymentsByMonthYear = useCallback(async (month: number, year: number, status?: 'paid' | 'unpaid', fromDate?: string, toDate?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      if (fromDate) {
        params.append('fromDate', fromDate);
      }

      if (toDate) {
        params.append('toDate', toDate);
      }

      const data = await apiClient.get(`/payments?${params.toString()}`);
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch payments.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getMonthlyStats = useCallback(async (month: number, year: number) => {
    try {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });

      const data = await apiClient.get(`/dashboard/stats?${params.toString()}`);

      return {
        totalHomes: data.total || 0,
        paidCount: data.paid || 0,
        unpaidCount: data.unpaid || 0,
        collectedAmount: data.total_collected || 0,
        pendingAmount: data.total_pending || 0,
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return {
        totalHomes: 0,
        paidCount: 0,
        unpaidCount: 0,
        collectedAmount: 0,
        pendingAmount: 0,
      };
    }
  }, []);

  return useMemo(() => ({
    loading,
    getPaymentStatus,
    markAsPaid,
    markAsUnpaid,
    getPaymentsByMonthYear,
    getMonthlyStats,
  }), [loading, getPaymentStatus, markAsPaid, markAsUnpaid, getPaymentsByMonthYear, getMonthlyStats]);
};


