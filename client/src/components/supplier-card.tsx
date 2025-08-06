import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Star } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  description: string;
  rating: number;
  qualityLevel: string;
  cooperationYears: number;
  isActive: boolean;
}

interface SupplierCardProps {
  supplier: Supplier;
  testId?: string;
}

export default function SupplierCard({ supplier, testId }: SupplierCardProps) {
  const getQualityBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge className="bg-success text-success-foreground">优质</Badge>;
      case "medium":
        return <Badge className="bg-warning text-warning-foreground">新合作</Badge>;
      case "low":
        return <Badge className="bg-destructive text-destructive-foreground">待观察</Badge>;
      default:
        return <Badge className="bg-secondary text-secondary-foreground">{level}</Badge>;
    }
  };

  const getIconColor = () => {
    switch (supplier.qualityLevel) {
      case "high":
        return "bg-primary text-white";
      case "medium":
        return "bg-info text-white";
      case "low":
        return "bg-warning text-white";
      default:
        return "bg-primary text-white";
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 fill-current text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-3 w-3 fill-current text-warning opacity-50" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />);
    }

    return stars;
  };

  const getCooperationText = (years: number) => {
    if (years < 1) {
      return `合作${Math.round(years * 12)}个月`;
    }
    return `合作${years}年`;
  };

  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
      data-testid={testId}
    >
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getIconColor()}`}>
          <Building className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium text-neutral-800" data-testid="text-supplier-name">{supplier.name}</h4>
          <p className="text-sm text-neutral-600" data-testid="text-supplier-description">{supplier.description}</p>
          <div className="flex items-center mt-1">
            {getQualityBadge(supplier.qualityLevel)}
            <div className="flex items-center ml-2 text-xs">
              {renderStars(supplier.rating)}
              <span className="ml-1 text-neutral-600" data-testid="text-supplier-rating">{supplier.rating}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="text-right">
        <Button
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 mb-2"
          data-testid="button-negotiate"
        >
          谈判
        </Button>
        <p className="text-xs text-neutral-600" data-testid="text-cooperation-years">
          {getCooperationText(supplier.cooperationYears)}
        </p>
      </div>
    </div>
  );
}
