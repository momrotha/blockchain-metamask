'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStore, faUserCircle, faChevronDown, faSignOutAlt, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import ProductCard from './components/ProductCard';
import WalletConnect from './components/WalletConnect';
import FiatCheckoutForm from './components/FiatCheckoutForm';
import ProductModal from './components/ProductModal';
import { useAppContext } from './context/AppContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { API_URL, PAYMENT_PROCESSOR_ADDRESS } from './config';

// ABI for the PaymentProcessor contract
const PAYMENT_PROCESSOR_ABI = [
  "function pay(string memory orderId) public payable"
];

export default function Home() {
  const { currentUser, setCurrentUser, cart, addToCart, clearCart } = useAppContext();
  const [products, setProducts] = useState([]);
  const [wallet, setWallet] = useState<{ address: string, signer: any } | null>(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<React.ReactNode | null>(null);
  
  // Auth dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Product detail state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showFiatCheckout, setShowFiatCheckout] = useState(false);
  const [activeCategory, setActiveCategory] = useState(`All`);
  const router = useRouter();

  useEffect(() => {
    axios.get(`${API_URL}/products`)
      .then(response => setProducts(response.data))
      .catch(error => {
        console.error("Error loading products:", error);
        toast.error("Failed to load products from backend");
      });
  }, []);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWalletConnect = (address: string, signer: any) => {
    setWallet({ address, signer });
  };

  const calculateTotalEth = () => {
    return cart.reduce((total, p) => total + p.price_eth, 0).toFixed(4);
  };

  const calculateTotalUsd = () => {
    return cart.reduce((total, p) => total + p.price_eth * 3000, 0).toFixed(2);
  };

  const handleCryptoCheckout = async () => {
    if (!wallet) {
      toast.error("Please connect your wallet first!");
      return;
    }
    if (cart.length === 0) return;

    setPaymentStatus(null);
    const toastId = toast.loading("Confirming transaction in MetaMask...");
    let orderId: string | null = null;
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // 11155111 in hex = Sepolia
          });
        } catch (switchErr) {
          console.warn("Chain switch error:", switchErr);
        }
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();

      const productId = cart[0].id;
      const orderRes = await axios.post(`${API_URL}/orders`, {
        product_id: productId,
        customer_address: currentAddress,
        user_email: currentUser ? currentUser.email : null
      });
      orderId = orderRes.data.id.toString();

      const contract = new ethers.Contract(PAYMENT_PROCESSOR_ADDRESS, PAYMENT_PROCESSOR_ABI, signer);
      const totalEth = calculateTotalEth();
      
      const tx = await contract.pay(orderId, {
        value: ethers.parseEther(totalEth.toString())
      });
      
      setPaymentStatus(
        <div className="flex flex-col items-center">
          <p className="font-bold mb-2">Transaction sent to Blockchain!</p>
          <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" className="text-blue-500 underline text-sm break-all">
            View on Block Explorer: {tx.hash}
          </a>
        </div>
      );
      toast.loading("Mining transaction on the blockchain...", { id: toastId });
      
      await tx.wait();
      
      if (orderId) {
        const verifyRes = await axios.post(`${API_URL}/verify-payment`, {
          order_id: parseInt(orderId),
          tx_hash: tx.hash
        });

        if (verifyRes.data.status === "payment verified") {
          setPaymentStatus(
            <div className="flex flex-col items-center text-green-700">
              <p className="font-bold text-lg mb-1">🎉 Payment Verified via Smart Contract!</p>
              <p className="text-sm">Your order has been recorded securely on-chain.</p>
            </div>
          );
          toast.success("Transaction Mined & Payment Verified!", { id: toastId });
          clearCart();
        }
      }
    } catch (err: any) {
      console.error(err);
      const isInsufficient = err.code === `INSUFFICIENT_FUNDS` || err.message?.toLowerCase().includes("insufficient funds");
      const isRejected = err.code === 4001 || err.message?.toLowerCase().includes("user rejected") || err.message?.toLowerCase().includes("user denied");

      const reason = isInsufficient
        ? "Insufficient ETH in wallet for item price + gas fee"
        : isRejected 
        ? "User rejected transaction in wallet"
        : (err.response?.data?.detail || err.message || "Unknown transaction error").slice(0, 100);

      setPaymentStatus(`Error: ${reason}`);
      toast.error(`Transaction failed: ${reason}`, { id: toastId });
      
      if (orderId) {
        try {
          await axios.post(`${API_URL}/orders/fail`, {
            order_id: parseInt(orderId),
            reason: reason
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans flex flex-col">
      <ProductModal
        isOpen={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        addToCart={handleAddToCart}
      />

      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-40 px-8 lg:px-16 shadow-sm">
        <h1 
          className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight flex items-center gap-3 cursor-pointer"
          onClick={() => setIsCheckout(false)}
        >
          <FontAwesomeIcon icon={faStore} className="text-blue-600" /> Rotha Shop
        </h1>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsCheckout(!isCheckout)}
            className="relative cursor-pointer text-xl text-gray-700 hover:text-blue-600 hover:scale-110 transition p-2 rounded-full hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md transform translate-x-1 -translate-y-1">
                {cart.length}
              </span>
            )}
          </button>
          
          {currentUser ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-full font-bold text-gray-700 flex items-center gap-2 shadow-sm transition"
              >
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} className="text-blue-500" />
                )}
                Account <FontAwesomeIcon icon={faChevronDown} className="text-xs ml-1" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  </div>
                  {currentUser.is_admin && (
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        router.push(`/admin`);
                      }}
                      className="w-full text-left px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-medium transition flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faIdBadge} /> Admin Dashboard
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      router.push(`/account`);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faIdBadge} /> Settings
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentUser(null);
                      setShowDropdown(false);
                      toast.success("Signed out successfully");
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium transition flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="font-bold py-2.5 px-6 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-700 transition shadow-sm flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUserCircle} /> Sign In
            </Link>
          )}

          <WalletConnect onConnect={handleWalletConnect} />
        </div>
      </header>

      <div className="flex-grow">
        {isCheckout ? (
          <div className="max-w-7xl mx-auto p-8 lg:px-16">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 max-w-2xl mx-auto mt-8 border border-gray-100">
              <h2 className="text-3xl font-extrabold mb-8 pb-6 border-b border-gray-100">Checkout</h2>
              {!currentUser ? (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faUserCircle} className="text-6xl text-gray-300 mb-4 block mx-auto" />
                  <p className="text-gray-500 text-xl">Please sign in to place an order.</p>
                  <button onClick={() => { setIsCheckout(false); router.push(`/login`); }} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Sign In</button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-6xl text-gray-300 mb-4 block mx-auto" />
                  <p className="text-gray-500 text-xl">Your cart is empty.</p>
                  <button onClick={() => setIsCheckout(false)} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Return to Shop</button>
                </div>
              ) : (
                <div>
                  <ul className="divide-y divide-gray-50 mb-8">
                    {cart.map((item, idx) => (
                      <li key={idx} className="py-5 flex justify-between items-center group">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm">
                             <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                          </div>
                          <span className="font-bold text-lg text-gray-800">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">${(item.price_eth * 3000).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50">
                    <span className="text-xl font-bold text-gray-700">Total</span>
                    <span className="text-3xl font-black text-blue-600">${calculateTotalUsd()}</span>
                  </div>
                  
                  {!showFiatCheckout ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowFiatCheckout(true)}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg transition-all transform hover:-translate-y-1 flex justify-center items-center gap-3"
                      >
                        Pay with Card
                      </button>
                      <button
                        onClick={handleCryptoCheckout}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 flex justify-center items-center gap-3"
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
                        Pay Crypto
                      </button>
                    </div>
                  ) : (
                    <FiatCheckoutForm 
                      amount={calculateTotalUsd()} 
                      onCancel={() => setShowFiatCheckout(false)}
                      onFailure={async (reason: string) => {
                        try {
                          await axios.post(`${API_URL}/orders`, {
                            product_id: cart[0].id,
                            customer_address: "Card Payment",
                            user_email: currentUser.email,
                            status: "failed",
                            failure_reason: reason
                          });
                        } catch (err) {
                          console.error(err);
                        }
                        setPaymentStatus(
                          <div className="flex flex-col items-center text-red-700">
                            <p className="font-bold text-lg mb-1">❌ Card Payment Declined!</p>
                            <p className="text-sm font-medium">Reason: {reason}</p>
                          </div>
                        );
                        setShowFiatCheckout(false);
                      }}
                      onSuccess={async () => {
                        try {
                          const orderRes = await axios.post(`${API_URL}/orders`, {
                            product_id: cart[0].id,
                            customer_address: "Fiat",
                            user_email: currentUser.email
                          });
                          await axios.post(`${API_URL}/verify-payment`, {
                            order_id: orderRes.data.id,
                            tx_hash: "FIAT"
                          });
                        } catch (err) {
                          console.error(err);
                        }
                        clearCart();
                        setPaymentStatus(
                          <div className="flex flex-col items-center text-green-700">
                            <p className="font-bold text-lg mb-1">✅ Fiat Payment Successful!</p>
                            <p className="text-sm">Your order has been confirmed.</p>
                          </div>
                        );
                        setShowFiatCheckout(false);
                      }}
                    />
                  )}

                  {paymentStatus && (
                    <div className="mt-8 p-6 rounded-2xl bg-blue-50/50 border border-blue-100 text-blue-900 text-center shadow-inner">
                      {paymentStatus}
                    </div>
                  )}
                </div>
              )}
              {!showFiatCheckout && cart.length > 0 && (
                <button onClick={() => setIsCheckout(false)} className="mt-8 text-gray-400 hover:text-gray-800 font-medium transition-colors block text-center w-full">
                  ← Back to Shop
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-50 to-[#F8FAFC] py-20 px-8 text-center border-b border-gray-100">
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">
                The Future of Commerce is <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Here.</span>
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
                Experience seamless, secure, and decentralized payments with Rotha, or just use a standard credit card. Your choice.
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1"
                >
                  Shop Now
                </button>
              </div>
            </div>

            {/* Products Section */}
            <div className="max-w-7xl mx-auto p-8 lg:px-16 py-16">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-3xl font-black text-gray-900">Featured Collection</h3>
                  <p className="text-gray-500 mt-1">Browse our curated selection.</p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (() => {
                const categories = ['All', ...Array.from(new Set((products as any[]).map((p: any) => p.category || 'General')))];
                const filtered = activeCategory === 'All'
                  ? products
                  : (products as any[]).filter((p: any) => (p.category || 'General') === activeCategory);
                return (
                  <>
                    {/* Category Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-10">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                            activeCategory === cat
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {(filtered as any[]).map((p: any) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          addToCart={handleAddToCart}
                          onView={(p) => setSelectedProduct(p)}
                        />
                      ))}
                    </div>

                    {(filtered as any[]).length === 0 && (
                      <div className="text-center py-20 text-gray-400">No products in this category yet.</div>
                    )}
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-12 text-center text-gray-500">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900 mb-4 md:mb-0">
            <FontAwesomeIcon icon={faStore} className="text-blue-600" /> Rotha Shop
          </div>
          <div className="text-sm">
            &copy; 2026 Rotha E-Commerce Demo. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
