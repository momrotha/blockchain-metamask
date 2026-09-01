'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';
import axios from 'axios';
import { Camera, CheckCircle, XCircle } from 'lucide-react';

export default function AccountProfilePage() {
  const { currentUser, setCurrentUser } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setAvatarUrl(currentUser.avatar_url || null);
      fetchOrders(currentUser.email);
    } else {
      const stored = localStorage.getItem('Rothashop_user');
      if (stored) {
        const u = JSON.parse(stored);
        setName(u.name);
        setEmail(u.email);
        setAvatarUrl(u.avatar_url || null);
        fetchOrders(u.email);
      }
    }
  }, [currentUser]);

  const fetchOrders = async (userEmail: string) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/orders/${userEmail}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.put(`http://127.0.0.1:8000/users/${email}`, { name });
      setCurrentUser(res.data);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading("Uploading avatar...");
    try {
      const res = await axios.post(`http://127.0.0.1:8000/users/${email}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.avatar_url);
      setCurrentUser({ name, email, avatar_url: res.data.avatar_url });
      toast.success("Avatar updated successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to upload avatar", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium tracking-tight text-gray-900">Profile</h3>
        <p className="text-sm text-gray-500 mt-1">This is how others will see you on the site.</p>
      </div>
      <div className="border-b border-gray-200" />
      
      <div className="flex flex-col-reverse md:flex-row gap-12">
        <form onSubmit={handleSave} className="space-y-8 flex-1 max-w-lg">
          <div className="space-y-3">
            <label className="text-sm font-medium leading-none text-gray-900">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
            />
            <p className="text-[0.8rem] text-gray-500">This is your public display name. It can be your real name or a pseudonym.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium leading-none text-gray-900">Email</label>
            <input
              type="email"
              disabled
              value={email}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 text-gray-500 px-3 py-2 text-sm focus:outline-none cursor-not-allowed"
            />
            <p className="text-[0.8rem] text-gray-500">Your email cannot be changed.</p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-gray-900 text-white hover:bg-gray-900/90 h-10 px-4 py-2 shadow-sm"
          >
            {isSaving ? "Saving..." : "Update profile"}
          </button>
        </form>

        <div className="flex flex-col items-start gap-4">
          <label className="text-sm font-medium leading-none text-gray-900">Avatar</label>
          <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center relative group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-gray-400 font-bold">{name?.charAt(0)?.toUpperCase() || '?'}</span>
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Upload new picture
          </button>
        </div>
      </div>

      <div className="pt-10">
        <div>
          <h3 className="text-xl font-medium tracking-tight text-gray-900">Order History</h3>
          <p className="text-sm text-gray-500 mt-1">Review your past successful and failed transactions.</p>
        </div>
        <div className="border-b border-gray-200 mt-4 mb-6" />

        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Order #{order.id} - {order.product_name}</h4>
                  <p className="text-sm text-gray-500">Amount: ${(order.price_eth * 3000).toFixed(2)}</p>
                  {order.failure_reason && (
                    <p className="text-xs text-red-600 font-medium mt-1">Reason: {order.failure_reason}</p>
                  )}
                  {order.tx_hash && order.tx_hash !== 'FAILED' && order.tx_hash !== 'FIAT' && (
                     <a href={`https://sepolia.etherscan.io/tx/${order.tx_hash}`} target="_blank" className="text-xs text-blue-500 hover:underline mt-1 block">
                       TX: {order.tx_hash.substring(0, 10)}...{order.tx_hash.substring(order.tx_hash.length - 10)}
                     </a>
                  )}
                </div>
                <div>
                  {order.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3.5 h-3.5" /> Success
                    </span>
                  ) : order.status === 'failed' ? (
                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
