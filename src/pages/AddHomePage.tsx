import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useHomes } from '@/hooks/useHomes';
import { UserPlus, Loader2 } from 'lucide-react';

const AddHomePage = () => {
  const navigate = useNavigate();
  const { addHome } = useHomes();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    home_id: '',
    customer_name: '',
    phone: '',
    set_top_box_id: '',
    monthly_amount: '200',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addHome({
      home_id: parseInt(formData.home_id),
      customer_name: formData.customer_name,
      phone: formData.phone,
      set_top_box_id: formData.set_top_box_id,
      monthly_amount: parseFloat(formData.monthly_amount),
    });

    setLoading(false);

    if (result) {
      navigate(`/search?homeId=${result.home_id}`);
    }
  };

  const isFormValid = 
    formData.home_id && 
    formData.customer_name && 
    formData.phone && 
    formData.set_top_box_id && 
    formData.monthly_amount;

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Home
            </CardTitle>
            <CardDescription>
              Register a new home for cable service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="home_id">Home ID *</Label>
                <Input
                  id="home_id"
                  name="home_id"
                  type="number"
                  placeholder="Enter unique home number"
                  value={formData.home_id}
                  onChange={handleChange}
                  required
                  min="1"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  type="text"
                  placeholder="Enter customer full name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="set_top_box_id">Set-Top Box ID *</Label>
                <Input
                  id="set_top_box_id"
                  name="set_top_box_id"
                  type="text"
                  placeholder="Enter cable box ID"
                  value={formData.set_top_box_id}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_amount">Monthly Amount (₹) *</Label>
                <Input
                  id="monthly_amount"
                  name="monthly_amount"
                  type="number"
                  placeholder="Enter monthly fee"
                  value={formData.monthly_amount}
                  onChange={handleChange}
                  required
                  min="1"
                  className="h-12"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg mt-6" 
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Adding Home...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add Home
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddHomePage;
