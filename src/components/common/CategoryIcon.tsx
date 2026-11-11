import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', style }) => {
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.Folder;
  return <IconComponent className={className} style={style} />;
};

export const AVAILABLE_ICONS = [
  'Utensils', 'Car', 'GraduationCap', 'ShoppingBag', 'Film', 'Zap',
  'Home', 'HeartPulse', 'Plane', 'Sparkles', 'Repeat', 'Users',
  'Cpu', 'MoreHorizontal', 'Briefcase', 'Laptop', 'Building', 'Award',
  'TrendingUp', 'Gift', 'Flame', 'PlusCircle', 'PiggyBank', 'CreditCard',
  'Banknote', 'Landmark', 'Smartphone', 'Shield', 'Coffee', 'Wifi',
  'Fuel', 'Music', 'BookOpen', 'Tag', 'DollarSign', 'Key'
];

export const MINIMAL_PALETTE = [
  { name: 'Sage Green', hex: '#A3B18A' },
  { name: 'Forest Muted', hex: '#588157' },
  { name: 'Terracotta', hex: '#BC4749' },
  { name: 'Slate Gray', hex: '#6C757D' },
  { name: 'Dusty Navy', hex: '#4A6D8C' },
  { name: 'Soft Ochre', hex: '#C99757' },
  { name: 'Warm Sand', hex: '#D4A373' },
  { name: 'Muted Plum', hex: '#8A6B7E' },
  { name: 'Charcoal', hex: '#343A40' },
  { name: 'Olive Drab', hex: '#606C38' },
  { name: 'Steel Blue', hex: '#52796F' },
  { name: 'Taupe Neutral', hex: '#7D7461' },
];

// Alias for backwards compatibility
export const NEON_COLORS = MINIMAL_PALETTE;
