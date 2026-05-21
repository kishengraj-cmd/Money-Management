import * as Lucide from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export default function CategoryIcon({ name, className = '', color = '#94A3B8' }: CategoryIconProps) {
  // Safe dynamic lucide-react loader
  // We can look up standard names in the Lucide object
  const IconComponent = (Lucide as any)[name] || Lucide.HelpCircle;

  return (
    <div
      className={`flex items-center justify-center rounded-xl p-2 ${className}`}
      style={{ backgroundColor: `${color}1A`, color: color }}
    >
      <IconComponent className="w-5 h-5 flex-shrink-0" />
    </div>
  );
}
