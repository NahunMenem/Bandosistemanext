'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Users,
  ShoppingCart,
  History,
  DollarSign,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/movimientos', label: 'Movimientos', icon: History },
  { href: '/caja', label: 'Caja', icon: DollarSign },
  { href: '/morosos', label: 'Morosos', icon: AlertTriangle },
  { href: '/pagos', label: 'Pagos', icon: CreditCard },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/clientes" className="flex items-center gap-2 text-white font-bold text-lg shrink-0">
            <ShoppingBag size={22} className="text-blue-400" />
            <span className="hidden sm:inline">Rodeo Calzados</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Logout button */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <LogOut size={15} />
              Salir
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-700 px-4 py-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 w-full text-left text-gray-400 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-lg text-sm mt-2"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}
