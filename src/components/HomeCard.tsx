import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PaymentStatusBadge from '@/components/PaymentStatusBadge';
import { Home, Phone, Tv, IndianRupee, CheckCircle, Loader2, XCircle, Edit, Trash2 } from 'lucide-react';

interface HomeCardProps {
  homeId: number;
  customerName: string;
  phone: string;
  setTopBoxId: string;
  monthlyAmount: number;
  paymentStatus: 'paid' | 'unpaid';
  paidDate: string | null;
  onMarkAsPaid: () => void;
  onMarkAsUnpaid?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  currentMonth: string;
}

const HomeCard = ({
  homeId,
  customerName,
  phone,
  setTopBoxId,
  monthlyAmount,
  paymentStatus,
  paidDate,
  onMarkAsPaid,
  onMarkAsUnpaid,
  onEdit,
  onDelete,
  loading = false,
  currentMonth,
}: HomeCardProps) => {
  const isPaid = paymentStatus === 'paid';

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Home #{homeId}</CardTitle>
              <p className="text-muted-foreground text-sm">{customerName}</p>
            </div>
          </div>
          <PaymentStatusBadge status={paymentStatus} size="lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Tv className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Set-Top Box ID</p>
              <p className="font-medium">{setTopBoxId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <IndianRupee className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Monthly Amount</p>
              <p className="font-medium">₹{monthlyAmount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Payment Month</p>
              <p className="font-medium">{currentMonth}</p>
            </div>
          </div>
        </div>

        {paidDate && (
          <p className="text-sm text-muted-foreground text-center">
            Paid on: {new Date(paidDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onMarkAsPaid}
            disabled={isPaid || loading}
            className="flex-1 h-12 text-lg bg-success hover:bg-success/90"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {isPaid ? 'Already Paid' : 'Mark as Paid'}
          </Button>

          {isPaid && onMarkAsUnpaid && (
            <Button
              onClick={onMarkAsUnpaid}
              disabled={loading}
              variant="outline"
              className="h-12"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </Button>
          )}

          <div className="flex gap-2">
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                className="h-12 w-12 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                title="Edit Customer"
              >
                <Edit className="w-5 h-5" />
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                className="h-12 w-12 p-0 text-destructive border-destructive/20 hover:bg-destructive/10"
                title="Delete Customer"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomeCard;
