'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCartPlus, faShieldAlt, faTruck } from '@fortawesome/free-solid-svg-icons';

export default function ProductModal({ 
  product, 
  isOpen, 
  onClose, 
  addToCart 
}: { 
  product: any; 
  isOpen: boolean; 
  onClose: () => void;
  addToCart: (p: any) => void;
}) {
  if (!isOpen || !product) return null;

  const usdPrice = (product.price_eth * 3000).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition backdrop-blur-md shadow-sm"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>
        
        {/* Left Side: Image */}
        <div className="md:w-1/2 bg-gray-50 flex items-center justify-center">
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-64 md:h-full object-cover"
          />
        </div>

        {/* Right Side: Details */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-2 text-sm font-bold text-blue-600 uppercase tracking-widest">
            Featured Product
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            {product.name}
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-end gap-4 mb-8 pb-8 border-b border-gray-100">
            <span className="text-5xl font-black text-gray-900">${usdPrice}</span>
            <span className="text-lg text-gray-500 font-medium pb-1">or {product.price_eth} ETH</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm text-gray-600 font-medium">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldAlt} className="text-green-500" />
              Secure Blockchain Checkout
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTruck} className="text-blue-500" />
              Free Global Shipping
            </div>
          </div>

          <button 
            onClick={() => {
              addToCart(product);
              onClose();
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-6 rounded-2xl text-xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 flex justify-center items-center gap-3"
          >
            <FontAwesomeIcon icon={faCartPlus} />
            Add to Cart - ${usdPrice}
          </button>
        </div>
      </div>
    </div>
  );
}
