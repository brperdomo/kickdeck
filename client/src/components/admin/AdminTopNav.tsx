import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, User, ChevronDown, Users as UsersIcon,
  Menu, X, AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type AdminSection } from '@/config/admin-navigation';

interface AdminTopNavProps {
  sections: AdminSection[];
  activeSection: string;
  activeView?: string;
  onSectionChange: (sectionId: string) => void;
  onItemClick?: (item: AdminSection['items'][number]) => void;
  user: any;
  logoUrl?: string;
  onLogout: () => void;
  onNavigateToAccount: () => void;
  onSwitchToMember: () => void;
  isEmulating?: boolean;
  emulatingUser?: string;
  onStopEmulation?: () => void;
}

export function AdminTopNav({
  sections,
  activeSection,
  activeView,
  onSectionChange,
  onItemClick,
  user,
  logoUrl,
  onLogout,
  onNavigateToAccount,
  onSwitchToMember,
  isEmulating,
  emulatingUser,
  onStopEmulation,
}: AdminTopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = () => {
    if (!user) return 'A';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  return (
    <>
      {/* Emulation indicator bar */}
      {isEmulating && (
        <div
          className="w-full px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(90deg, rgba(220,38,38,0.9) 0%, rgba(185,28,28,0.9) 100%)',
            color: 'white',
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="font-bold">EMULATION MODE:</span>
          <span>{emulatingUser || 'Viewing as another administrator'}</span>
          {onStopEmulation && (
            <button
              onClick={onStopEmulation}
              className="ml-3 px-2 py-0.5 rounded text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors"
            >
              Exit
            </button>
          )}
        </div>
      )}

      {/* Main nav header */}
      <header
        className="sticky top-0 z-40 admin-top-nav"
        style={{
          background: 'rgba(15, 15, 35, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4), 0 0 20px rgba(124,58,237,0.08), 0 1px 0 rgba(124,58,237,0.1)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={logoUrl || '/uploads/KickDeck_Linear_White.png'}
              alt="KickDeck"
              className="h-7 object-contain"
              style={{ filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.15))' }}
            />
          </div>

          {/* Center: Section tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
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
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(156, 163, 175, 0.8)';
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.6) 50%, rgba(124,58,237,0) 100%)',
                      }}
                      layoutId="adminSectionIndicator"
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    />
                  )}
                </button>
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
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Avatar className="h-8 w-8 border border-violet-500/30">
                    <AvatarFallback
                      className="text-xs font-medium"
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.2) 100%)',
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
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(124,58,237,0.08)',
                }}
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-violet-500/10" />
                <DropdownMenuItem
                  onClick={onNavigateToAccount}
                  className="text-gray-300 hover:text-white focus:text-white hover:bg-violet-500/10 focus:bg-violet-500/10 cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onSwitchToMember}
                  className="text-gray-300 hover:text-white focus:text-white hover:bg-violet-500/10 focus:bg-violet-500/10 cursor-pointer"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Member View
                </DropdownMenuItem>
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

      {/* Mobile section tabs drawer */}
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
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                const Icon = section.icon;

                return (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        onSectionChange(section.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: isActive ? '#ffffff' : 'rgba(156, 163, 175, 0.8)',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                    {/* Show sub-items for active section on mobile */}
                    {isActive && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = item.view === activeView;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                onItemClick?.(item);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors"
                              style={{
                                background: isItemActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                                color: isItemActive ? '#ffffff' : 'rgba(156, 163, 175, 0.8)',
                              }}
                            >
                              <ItemIcon className="h-3.5 w-3.5" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
