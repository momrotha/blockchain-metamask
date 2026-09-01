'use client';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

export default function ProductCard({ 
  product, 
  addToCart,
  onView
}: { 
  product: any, 
  addToCart: (p: any) => void,
  onView: (p: any) => void
}) {
  const usdPrice = (product.price_eth * 3000).toFixed(2);

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white transform hover:-translate-y-1">
      <div 
        className="h-48 overflow-hidden relative group cursor-pointer"
        onClick={() => onView(product)}
      >
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-bold tracking-wider uppercase text-sm border-2 border-white px-4 py-2 rounded-lg">View Details</span>
        </div>
      </div>
      <div className="p-5">
        <h3 
          className="text-xl font-bold mb-2 text-gray-800 hover:text-blue-600 cursor-pointer transition"
          onClick={() => onView(product)}
        >
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-xl text-gray-800">${usdPrice}</span>
          <button 
            onClick={() => addToCart(product)}
            className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faCartPlus} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
