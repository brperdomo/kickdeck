import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, User, Home, Calendar, UserPlus, Shield,
  Menu, X, ChevronDown,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MemberTopNavProps {
  user: any;
  logoUrl?: string;
  hasAdminAccess?: boolean;
  onLogout: () => void;
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/my-household', label: 'Household', icon: UserPlus },
  { href: '/dashboard/registrations', label: 'Registrations', icon: Calendar },
];

export function MemberTopNav({
  user,
  logoUrl,
  hasAdminAccess,
  onLogout,
}: MemberTopNavProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = () => {
    if (!user) return 'M';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
          boxShadow:
            '0 4px 30px rgba(0,0,0,0.3), 0 0 15px rgba(124,58,237,0.05)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Logo + portal label */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={logoUrl || '/uploads/KickDeck_Linear_White.png'}
              alt="KickDeck"
              className="h-7 object-contain"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.15))',
              }}
            />
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <span className="font-semibold text-sm bg-gradient-to-r from-violet-300 via-purple-200 to-violet-300 bg-clip-text text-transparent">
                Member
              </span>
              <span className="font-medium text-sm text-gray-500">Portal</span>
            </div>
          </div>

          {/* Center: Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(109,40,217,0.15) 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(156, 163, 175, 0.8)',
                    border: isActive
                      ? '1px solid rgba(124,58,237,0.3)'
                      : '1px solid transparent',
                    boxShadow: isActive
                      ? '0 0 15px rgba(124,58,237,0.15), 0 0 30px rgba(124,58,237,0.05)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.color =
                        'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        'transparent';
                      (e.currentTarget as HTMLElement).style.color =
                        'rgba(156, 163, 175, 0.8)';
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.6) 50%, rgba(124,58,237,0) 100%)',
                      }}
                      layoutId="memberNavIndicator"
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: User dropdown + mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Avatar className="h-8 w-8 border border-violet-500/30">
                    <AvatarFallback
                      className="text-xs font-medium"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.2) 100%)',
                        color: 'rgba(167, 139, 250, 1)',
                      }}
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56"
                style={{
                  background: 'rgba(20, 18, 45, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                  boxShadow:
                    '0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(124,58,237,0.08)',
                }}
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-violet-500/10" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/my-account"
                    className="text-gray-300 hover:text-white focus:text-white hover:bg-violet-500/10 focus:bg-violet-500/10 cursor-pointer flex items-center w-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                {hasAdminAccess && (
                  <>
                    <DropdownMenuSeparator className="bg-violet-500/10" />
                    <DropdownMenuItem
                      onClick={() => (window.location.href = '/admin')}
                      className="text-gray-300 hover:text-white focus:text-white hover:bg-violet-500/10 focus:bg-violet-500/10 cursor-pointer"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-violet-500/10" />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden z-30 relative"
            style={{
              background: 'rgba(15, 15, 35, 0.95)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: isActive
                        ? 'rgba(124,58,237,0.15)'
                        : 'transparent',
                      color: isActive
                        ? '#ffffff'
                        : 'rgba(156, 163, 175, 0.8)',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
