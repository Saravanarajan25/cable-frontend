import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'destructive';
}

const StatCard = ({ title, value, icon: Icon, variant = 'default' }: StatCardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success/10 border-success/20';
      case 'destructive':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'success':
        return 'text-success';
      case 'destructive':
        return 'text-destructive';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={`${getVariantClasses()} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${getVariantClasses()}`}>
            <Icon className={`w-6 h-6 ${getIconClasses()}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
