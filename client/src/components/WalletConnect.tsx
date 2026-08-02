import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Wallet, LogOut } from 'lucide-react';

interface WalletConnectProps {
  onConnect?: (walletAddress: string, walletType: 'phantom' | 'magic') => void;
  onDisconnect?: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect }) => {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'phantom' | 'magic' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectPhantom = async () => {
    setLoading(true);
    setError(null);

    try {
      const phantom = (window as any)?.phantom?.solana;
      if (!phantom) {
        throw new Error('Phantom wallet not installed. Install from https://phantom.app');
      }

      const response = await phantom.connect();
      const walletAddress = response.publicKey.toString();

      setConnectedWallet(walletAddress);
      setWalletType('phantom');
      onConnect?.(walletAddress, 'phantom');
    } catch (err) {
      setError(`Failed to connect Phantom: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const connectMagic = async () => {
    setLoading(true);
    setError(null);

    try {
      // Placeholder for Magic wallet connection
      // In production, use Magic SDK
      throw new Error('Magic wallet integration coming soon');
    } catch (err) {
      setError(`Failed to connect Magic: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (walletType === 'phantom') {
        const phantom = (window as any)?.phantom?.solana;
        if (phantom) {
          await phantom.disconnect();
        }
      }

      setConnectedWallet(null);
      setWalletType(null);
      setError(null);
      onDisconnect?.();
    } catch (err) {
      setError(`Failed to disconnect: ${String(err)}`);
    }
  };

  if (connectedWallet && walletType) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {walletType === 'phantom' ? 'Phantom' : 'Magic'} Connected
              </p>
              <p className="text-xs text-green-700">
                {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
              </p>
            </div>
          </div>
          <Button
            onClick={disconnect}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Connect Wallet</h3>

        {error && (
          <div className="flex gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={connectPhantom}
            disabled={loading}
            className="w-full gap-2"
            variant="default"
          >
            <Wallet className="w-4 h-4" />
            {loading ? 'Connecting...' : 'Connect Phantom'}
          </Button>

          <Button
            onClick={connectMagic}
            disabled={loading}
            className="w-full gap-2"
            variant="outline"
          >
            <Wallet className="w-4 h-4" />
            {loading ? 'Connecting...' : 'Connect Magic (Coming Soon)'}
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Connect your wallet to import your portfolio and track your holdings.
        </p>
      </div>
    </Card>
  );
};

export default WalletConnect;
