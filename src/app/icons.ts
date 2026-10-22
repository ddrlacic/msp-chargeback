import {
  ArrowLeftRight,
  Bell,
  ChevronRight,
  CircleAlert,
  Clock,
  Construction,
  FileText,
  LayoutDashboard,
  LogOut,
  LucideIconProvider,
  LUCIDE_ICONS,
  Menu,
  RotateCcw,
  Settings,
  User,
  Users,
  Wallet,
} from 'lucide-angular';
import { Provider } from '@angular/core';

export const APP_ICONS = {
  ArrowLeftRight,
  Bell,
  ChevronRight,
  CircleAlert,
  Clock,
  Construction,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Settings,
  User,
  Users,
  Wallet,
};

export function provideAppIcons(): Provider {
  return { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(APP_ICONS) };
}
