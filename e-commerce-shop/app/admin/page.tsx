'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Users, Package, ShoppingBag, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, paid: 0, failed: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/admin/users'),
          axios.get('http://127.0.0.1:8000/admin/products'),
          axios.get('http://127.0.0.1:8000/admin/orders'),
        ]);
        const orders = ordersRes.data;
        setStats({
          users: usersRes.data.length,
          products: productsRes.data.length,
          orders: orders.length,
          paid: orders.filter((o: any) => o.status === 'paid').length,
          failed: orders.filter((o: any) => o.status === 'failed').length,
          pending: orders.filter((o: any) => o.status === 'pending').length,
        });
        setRecentOrders(orders.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 mt-1">Platform summary at a glance.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { label: 'Total Users', value: stats.users, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Products', value: stats.products, icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-5 ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400 font-medium">{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
            <p className="text-xs text-gray-500">Successful</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-400" /> Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-indigo-400 hover:text-indigo-300 transition">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-800">
              <th className="text-left py-3 px-6">#</th>
              <th className="text-left py-3 px-6">Product</th>
              <th className="text-left py-3 px-6">Customer</th>
              <th className="text-left py-3 px-6">Amount</th>
              <th className="text-left py-3 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {recentOrders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-6 text-gray-500">#{o.id}</td>
                <td className="py-4 px-6 text-white font-medium">{o.product_name}</td>
                <td className="py-4 px-6 text-gray-400">{o.user_email || 'Guest'}</td>
                <td className="py-4 px-6 text-gray-300">${(o.price_eth * 3000).toFixed(2)}</td>
                <td className="py-4 px-6">
                  {o.status === 'paid' ? <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">Paid</span>
                  : o.status === 'failed' ? <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">Failed</span>
                  : <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
