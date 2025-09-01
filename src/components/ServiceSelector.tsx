import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ServiceType = 'auto' | 'code' | 'creative' | 'knowledge' | 'general';

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onServiceChange: (service: ServiceType) => void;
  className?: string;
}

const serviceOptions = [
  { value: 'auto', label: 'Auto', icon: '🤖', description: 'Smart routing' },
  { value: 'code', label: 'Code', icon: '💻', description: 'Programming help' },
  { value: 'creative', label: 'Creative', icon: '🎨', description: 'Writing & ideas' },
  { value: 'knowledge', label: 'Knowledge', icon: '📚', description: 'Research & facts' },
  { value: 'general', label: 'General', icon: '💬', description: 'Chat & support' },
] as const;

export function ServiceSelector({ selectedService, onServiceChange, className }: ServiceSelectorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Horizontal scroll */}
      <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {serviceOptions.map((service) => (
          <Button
            key={service.value}
            variant={selectedService === service.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "shrink-0 h-8 px-3 text-xs bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300",
              selectedService === service.value && "bg-gradient-primary text-primary-foreground"
            )}
            onClick={() => onServiceChange(service.value as ServiceType)}
          >
            <span className="mr-1">{service.icon}</span>
            {service.label}
          </Button>
        ))}
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-5 gap-2 p-1 bg-gradient-glass rounded-lg border border-glass-border">
        {serviceOptions.map((service) => (
          <Button
            key={service.value}
            variant={selectedService === service.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "h-12 flex flex-col items-center justify-center gap-1 bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300",
              selectedService === service.value && "bg-gradient-primary text-primary-foreground"
            )}
            onClick={() => onServiceChange(service.value as ServiceType)}
          >
            <span className="text-lg">{service.icon}</span>
            <span className="text-xs font-medium">{service.label}</span>
          </Button>
        ))}
      </div>
      
      {/* Service Description */}
      <div className="mt-2 text-center">
        <Badge variant="outline" className="bg-gradient-glass border-glass-border text-xs">
          {serviceOptions.find(s => s.value === selectedService)?.description}
        </Badge>
      </div>
    </div>
  );
}

export default ServiceSelector;