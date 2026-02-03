import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'paid' | 'unpaid';
  size?: 'sm' | 'lg';
}

const PaymentStatusBadge = ({ status, size = 'sm' }: PaymentStatusBadgeProps) => {
  const isPaid = status === 'paid';
  
  const sizeClasses = size === 'lg' ? 'text-base px-4 py-2' : 'text-xs px-2.5 py-0.5';
  
  return (
    <Badge 
      className={`${sizeClasses} ${
        isPaid 
          ? 'bg-success hover:bg-success/90 text-success-foreground' 
          : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
      }`}
    >
      {isPaid ? (
        <>
          <CheckCircle className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} mr-1`} />
          Paid
        </>
      ) : (
        <>
          <XCircle className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} mr-1`} />
          Not Paid
        </>
      )}
    </Badge>
  );
};

export default PaymentStatusBadge;
