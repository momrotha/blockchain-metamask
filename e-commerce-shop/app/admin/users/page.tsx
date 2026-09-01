'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, ShieldCheck, UserCircle2, RefreshCcw, Search, ShoppingBag } from 'lucide-react';

type User = {
  email: string;
  name: string;
  is_admin: boolean;
  avatar_url: string | null;
  order_count?: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Record<string, any[]>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/admin/users');
      setUsers(res.data);
      setFiltered(res.data);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(users); return; }
    setFiltered(users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, users]);

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete user: ${email}?`)) return;
    setDeletingEmail(email);
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/users/${email}`);
      toast.success(`User ${email} deleted`);
      setUsers(prev => prev.filter(u => u.email !== email));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setDeletingEmail(null);
    }
  };

  const handleViewOrders = async (email: string) => {
    if (expandedEmail === email) { setExpandedEmail(null); return; }
    if (!userOrders[email]) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/orders/${email}`);
        setUserOrders(prev => ({ ...prev, [email]: res.data }));
      } catch { toast.error('Failed to load orders'); }
    }
    setExpandedEmail(email);
  };

  const totalAdmins = users.filter(u => u.is_admin).length;
  const totalUsers = users.filter(u => !u.is_admin).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage all registered accounts.</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-sm text-gray-400 mb-1">Total Accounts</p>
          <p className="text-4xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-indigo-500/20 p-5">
          <p className="text-sm text-gray-400 mb-1">Standard Users</p>
          <p className="text-4xl font-bold text-indigo-400">{totalUsers}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-amber-500/20 p-5">
          <p className="text-sm text-gray-400 mb-1">Admins</p>
          <p className="text-4xl font-bold text-amber-400">{totalAdmins}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-700 bg-gray-800 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-800">
                <th className="text-left py-3 px-6">User</th>
                <th className="text-left py-3 px-6">Email</th>
                <th className="text-left py-3 px-6">Role</th>
                <th className="text-right py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <>
                  <tr key={user.email} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center ring-2 ring-gray-700">
                            <span className="text-indigo-300 font-bold text-sm">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                          </div>
                        )}
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{user.email}</td>
                    <td className="py-4 px-6">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-gray-700/60 text-gray-400">
                          <UserCircle2 className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewOrders(user.email)}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs px-3 py-1.5 rounded-lg transition font-medium"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {expandedEmail === user.email ? 'Hide Orders' : 'View Orders'}
                        </button>
                        {!user.is_admin && (
                          <button
                            onClick={() => handleDelete(user.email)}
                            disabled={deletingEmail === user.email}
                            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingEmail === user.email ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Inline Orders Expansion */}
                  {expandedEmail === user.email && (
                    <tr key={`${user.email}-orders`} className="bg-gray-800/30 border-b border-gray-800">
                      <td colSpan={4} className="px-6 py-4">
                        {userOrders[user.email]?.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No orders placed yet.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-3">Order History</p>
                            {userOrders[user.email]?.map((o: any) => (
                              <div key={o.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
                                <div>
                                  <p className="text-white font-medium text-sm">#{o.id} — {o.product_name}</p>
                                  <p className="text-gray-500 text-xs mt-0.5">${(o.price_eth * 3000).toFixed(2)}</p>
                                  {o.failure_reason && (
                                    <p className="text-xs text-red-400 font-normal mt-0.5">Reason: {o.failure_reason}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {o.tx_hash && o.tx_hash !== 'FIAT' && (
                                    <a href={`https://sepolia.etherscan.io/tx/${o.tx_hash}`} target="_blank" className="text-indigo-400 text-xs hover:underline">
                                      {o.tx_hash.slice(0, 8)}...
                                    </a>
                                  )}
                                  {o.status === 'paid' ? <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Paid</span>
                                  : o.status === 'failed' ? <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Failed</span>
                                  : <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
