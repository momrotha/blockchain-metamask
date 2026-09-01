'use client';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, Shield, Bell } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Basic protect route
    if (currentUser === null && typeof window !== 'undefined') {
      const stored = localStorage.getItem('Rothashop_user');
      if (!stored) {
        router.push('/login');
      }
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-2xl font-black flex items-center gap-2">
          <FontAwesomeIcon icon={faStore} className="text-blue-600" /> Rotha Shop
        </Link>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full pt-10 px-8 gap-12">
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-2xl font-semibold tracking-tight mb-6 text-gray-900">Settings</h2>
          <nav className="flex flex-col space-y-1">
            <Link href="/account" className="bg-gray-100 text-gray-900 font-medium px-4 py-2 rounded-md flex items-center gap-3">
              <User className="w-4 h-4" /> Profile
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-3 transition-colors">
              <Settings className="w-4 h-4" /> Account
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-3 transition-colors">
              <Shield className="w-4 h-4" /> Security
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-3 transition-colors">
              <Bell className="w-4 h-4" /> Notifications
            </Link>
          </nav>
        </aside>

        <main className="flex-1 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
