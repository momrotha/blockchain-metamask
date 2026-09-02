'use client';
import { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

export default function WalletConnect({ onConnect }: { onConnect: (address: string, signer: any) => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        setIsConnecting(true);
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAddress(address);
        onConnect(address, signer);
        toast.success("Wallet connected!");

        // Auto update when user switches account in MetaMask
        (window as any).ethereum.on('accountsChanged', async (accounts: string[]) => {
          if (accounts.length > 0) {
            const freshProvider = new ethers.BrowserProvider((window as any).ethereum);
            const newSigner = await freshProvider.getSigner();
            const newAddr = await newSigner.getAddress();
            setAddress(newAddr);
            onConnect(newAddr, newSigner);
            toast.info(`Switched wallet to ${newAddr.slice(0,6)}...${newAddr.slice(-4)}`);
          } else {
            setAddress(null);
          }
        });

        (window as any).ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      } catch (error) {
        console.error("Wallet connection failed:", error);
        toast.error("Failed to connect wallet.");
      } finally {
        setIsConnecting(false);
      }
    } else {
      toast.error("Please install MetaMask!");
    }
  };

  return (
    <button 
      onClick={connectWallet}
      disabled={isConnecting}
      className={`font-bold py-2.5 px-6 rounded-full transition-all shadow-md flex items-center gap-2 ${address ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:shadow-lg'}`}
    >
      {address ? (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          {`${address.slice(0,6)}...${address.slice(-4)}`}
        </>
      ) : isConnecting ? (
        "Connecting..."
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
}
