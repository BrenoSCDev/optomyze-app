/**
 * WIDGET ICONS
 *
 * The icon set a widget can be branded with. Keys are stored in the widget
 * config and drawn by the embed script (public/widgets/form.js) — keep both
 * lists in sync when adding an icon.
 */

import React from 'react';
import {
  MessageCircle, Mail, User, Phone, Calendar,
  Star, Rocket, Heart, Sparkles, Briefcase, LucideIcon,
} from 'lucide-react';
import { WidgetIcon } from '../../services/widgetApi';

export const WIDGET_ICON_COMPONENTS: Record<WidgetIcon, LucideIcon> = {
  'message-circle': MessageCircle,
  mail: Mail,
  user: User,
  phone: Phone,
  calendar: Calendar,
  star: Star,
  rocket: Rocket,
  heart: Heart,
  sparkles: Sparkles,
  briefcase: Briefcase,
};

interface WidgetIconGlyphProps {
  icon: WidgetIcon;
  className?: string;
}

export const WidgetIconGlyph: React.FC<WidgetIconGlyphProps> = ({ icon, className }) => {
  const Icon = WIDGET_ICON_COMPONENTS[icon] ?? MessageCircle;
  return <Icon className={className} />;
};

/** Preset swatches offered next to the free-form color input. */
export const WIDGET_COLOR_PRESETS = [
  '#7C3AED', '#2563EB', '#0EA5E9', '#059669',
  '#F59E0B', '#EF4444', '#EC4899', '#111827',
];
