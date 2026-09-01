'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { RefreshCcw, ExternalLink, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/admin/orders');
      setOrders(res.data);
      setFiltered(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let data = orders;
    if (statusFilter !== 'all') data = data.filter(o => o.status === statusFilter);
    if (search) data = data.filter(o =>
      o.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.user_email || '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(data);
  }, [search, statusFilter, orders]);

  const statusBadge = (status: string) => {
    if (status === 'paid') return <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Paid</span>;
    if (status === 'failed') return <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Failed</span>;
    return <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 mt-1">Full history of all customer transactions.</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product or email..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-700 bg-gray-800 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-700 bg-gray-800 text-sm text-white px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No orders found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-800">
                <th className="text-left py-3 px-6">#</th>
                <th className="text-left py-3 px-6">Product</th>
                <th className="text-left py-3 px-6">Customer</th>
                <th className="text-left py-3 px-6">Amount</th>
                <th className="text-left py-3 px-6">Payment</th>
                <th className="text-left py-3 px-6">Status</th>
                <th className="text-left py-3 px-6">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 px-6 text-gray-500 font-mono">#{o.id}</td>
                  <td className="py-4 px-6 text-white font-medium">
                    {o.product_name}
                    {o.failure_reason && (
                      <p className="text-xs text-red-400 font-normal mt-0.5">{o.failure_reason}</p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {o.user_email ? (
                      <span className="text-indigo-400">{o.user_email}</span>
                    ) : (
                      <span className="text-gray-500 italic">Guest</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-300">${(o.price_eth * 3000).toFixed(2)}</td>
                  <td className="py-4 px-6 text-gray-400 text-xs">
                    {o.tx_hash === 'FIAT' ? (
                      <span className="bg-gray-700 px-2 py-1 rounded-md">Card</span>
                    ) : o.tx_hash ? (
                      <span className="bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-md">Crypto</span>
                    ) : '—'}
                  </td>
                  <td className="py-4 px-6">{statusBadge(o.status)}</td>
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                    {o.tx_hash && o.tx_hash !== 'FIAT' ? (
                      <a href={`https://sepolia.etherscan.io/tx/${o.tx_hash}`} target="_blank" className="text-indigo-400 hover:underline flex items-center gap-1">
                        {o.tx_hash.slice(0, 8)}...{o.tx_hash.slice(-6)} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : o.tx_hash === 'FIAT' ? 'Card Payment' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
