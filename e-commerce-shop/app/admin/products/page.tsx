'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, X, RefreshCcw, Package } from 'lucide-react';

type Product = {
  id: number;
  name: string;
  description: string;
  price_eth: number;
  image_url: string;
};

const EMPTY_FORM = { name: '', description: '', price_eth: '', image_url: '', category: '' };

const CATEGORIES = ['Clothing', 'Electronics', 'Food & Drink', 'Books', 'Beauty', 'Sports', 'Home', 'General'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/products`);
      setProducts(res.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description, price_eth: String((p.price_eth * 3000).toFixed(2)), image_url: p.image_url, category: (p as any).category || 'General' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert USD input back to ETH for storage
      const payload = { ...form, price_eth: parseFloat(form.price_eth) / 3000 };
      if (editProduct) {
        const res = await axios.put(`${API_URL}/admin/products/${editProduct.id}`, payload);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? res.data : p));
        toast.success('Product updated');
      } else {
        const res = await axios.post(`${API_URL}/admin/products`, payload);
        setProducts(prev => [...prev, res.data]);
        toast.success('Product created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success(`"${name}" deleted`);
    } catch { toast.error('Failed to delete product'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400 mt-1">Manage your store's product catalogue.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchProducts} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-800">
                <th className="text-left py-3 px-6">Product</th>
                <th className="text-left py-3 px-6">Description</th>
                <th className="text-left py-3 px-6">Price ($)</th>
                <th className="text-right py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-gray-700" />
                      <span className="font-medium text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-400 max-w-xs truncate">{p.description}</td>
                  <td className="py-4 px-6 text-gray-300 font-semibold">${(p.price_eth * 3000).toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs px-3 py-1.5 rounded-lg transition font-medium">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-3 py-1.5 rounded-lg transition font-medium">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                { label: 'Product Name', key: 'name', placeholder: 'e.g. Wireless Headphones', type: 'text' },
                { label: 'Price ($)', key: 'price_eth', placeholder: 'e.g. 30.00', type: 'number' },
                { label: 'Image URL', key: 'image_url', placeholder: 'https://...', type: 'text' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">{label}</label>
                  <input
                    type={type}
                    step={type === 'number' ? '0.01' : undefined}
                    required
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Category</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product description..."
                  className="flex w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                />
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editProduct ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
