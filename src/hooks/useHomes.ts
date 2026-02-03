import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Home {
  id: string;
  home_id: number;
  customer_name: string;
  phone: string;
  set_top_box_id: string;
  monthly_amount: number;
  created_at: string;
  updated_at: string;
}

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

export interface HomeWithPayment extends Home {
  payment_status: 'paid' | 'unpaid';
  paid_date: string | null;
}

export const useHomes = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchHomeById = useCallback(async (homeId: number): Promise<Home | null> => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/homes/${homeId}`);
      return data;
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return null;
      }
      toast({
        title: 'Error',
        description: 'Failed to search for home.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addHome = useCallback(async (home: Omit<Home, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const data = await apiClient.post('/homes', home);
      toast({
        title: 'Success',
        description: 'Home added successfully.',
      });
      return data;
    } catch (error: any) {
      let message = 'Failed to add home.';
      if (error.message.includes('already exists')) {
        message = 'A home with this ID already exists.';
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateHome = useCallback(async (homeId: number, home: Partial<Home>) => {
    try {
      setLoading(true);
      const data = await apiClient.put(`/homes/${homeId}`, home);
      toast({
        title: 'Success',
        description: 'Home updated successfully.',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update home.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteHome = useCallback(async (homeId: number) => {
    try {
      setLoading(true);
      const data = await apiClient.delete(`/homes/${homeId}`);
      toast({
        title: 'Success',
        description: 'Home deleted successfully.',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete home.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return useMemo(() => ({
    loading,
    searchHomeById,
    addHome,
    updateHome,
    deleteHome,
  }), [loading, searchHomeById, addHome, updateHome, deleteHome]);
};


