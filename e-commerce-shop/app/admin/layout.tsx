'use client';
import { useAppContext } from '../context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { LayoutDashboard, Users, ShoppingBag, Package, ChevronRight } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('Rothashop_user');
    const user = currentUser || (stored ? JSON.parse(stored) : null);
    if (!user || !user.is_admin) {
      router.push('/');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-black flex items-center gap-2 text-white">
            <FontAwesomeIcon icon={faStore} className="text-indigo-400" /> Rotha Shop
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full tracking-wide uppercase">Admin Panel</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
          ← Back to Store
        </Link>
      </header>

      <div className="flex flex-1">
        <aside className="w-60 bg-gray-900 border-r border-gray-800 p-5 flex flex-col gap-1 flex-shrink-0 sticky top-[65px] h-[calc(100vh-65px)]">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-2">Management</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 font-medium px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            );
          })}
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
