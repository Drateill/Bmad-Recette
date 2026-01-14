import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import ThemeToggle from '../shared/ThemeToggle';
import SyncStatusBadge from '../shared/SyncStatusBadge';

const navItems = [
  { label: 'My Recipes', path: '/recipes', icon: BookOpenIcon },
  { label: 'Discover', path: '/discover', icon: SparklesIcon },
  { label: 'Menu Planner', path: '/menu', icon: CalendarDaysIcon },
  { label: 'Shopping Lists', path: '/shopping', icon: ShoppingCartIcon },
  { label: 'Account', path: '/account', icon: Cog6ToothIcon },
];

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/recipes/new')) {
    return 'Create Recipe';
  }
  if (pathname.startsWith('/recipes/')) {
    return 'Recipe Detail';
  }
  const match = navItems.find((item) => pathname.startsWith(item.path));
  if (match) {
    return match.label;
  }
  return 'BMad Recette';
};

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-surface-elevated border-r border-border-subtle px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                BMad Recette
              </p>
              <h1 className="text-2xl font-semibold">Kitchen HQ</h1>
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-base ${
                      isActive
                        ? 'bg-brand-primary text-text-inverse shadow-soft'
                        : 'text-text-secondary hover:bg-surface-muted'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <ThemeToggle />
            <div className="rounded-xl border border-border-subtle bg-surface-muted p-4 text-sm">
              <p className="text-text-muted">Signed in as</p>
              <p className="font-semibold">
                {user?.firstName || 'User'}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-full border border-border-subtle px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-elevated"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-elevated/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-content items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
                  {pageTitle}
                </p>
                <h2 className="text-2xl font-semibold">{pageTitle}</h2>
              </div>
              <div className="flex items-center gap-4">
                <SyncStatusBadge />
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                <div className="hidden lg:flex items-center gap-2 text-sm">
                  <span className="text-text-muted">Hello,</span>
                  <span className="font-semibold">{user?.firstName || 'Chef'}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-content flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border-subtle bg-surface-elevated lg:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors duration-base ${
                    isActive
                      ? 'bg-brand-primary text-text-inverse'
                      : 'text-text-secondary'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label.split(' ')[0]}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
