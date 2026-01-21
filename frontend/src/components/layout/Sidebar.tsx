import { Link, useLocation } from 'react-router-dom';
import { Video, Upload, Home, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/videos', label: 'Videos', icon: Video },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/upload', label: 'Upload', icon: Upload },
  ];

  return (
    <aside className="w-60 bg-white border-r border-border hidden lg:block">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-primary border border-primary'
                    : 'text-foreground hover:bg-accent-hover'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}