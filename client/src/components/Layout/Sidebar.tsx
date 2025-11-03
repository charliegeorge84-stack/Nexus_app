import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Ticket,
  Users,
  Settings,
  BarChart3,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['admin', 'process_team', 'supervisor', 'support_ops', 'agent'],
    },
    {
      name: 'Process Tickets',
      href: '/tickets',
      icon: Ticket,
      roles: ['admin', 'process_team', 'supervisor', 'support_ops', 'agent'],
    },
    {
      name: 'Admin Console',
      href: '/admin',
      icon: Settings,
      roles: ['admin'],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'supervisor', 'support_ops'],
    },
    {
      name: 'Documentation',
      href: '/docs',
      icon: FileText,
      roles: ['admin', 'process_team', 'supervisor', 'support_ops', 'agent'],
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      roles: ['admin', 'process_team', 'supervisor', 'support_ops', 'agent'],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-72'
    }`}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-semibold text-gray-900">
                Process Manager
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-2 py-4">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                          ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                        />
                        {!collapsed && item.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* User info */}
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>

        {/* Collapse button */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
