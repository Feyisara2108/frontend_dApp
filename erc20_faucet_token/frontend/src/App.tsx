import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useReadContract } from './hooks/contracthooks/useReadContract';
import { useWriteContract } from './hooks/contracthooks/useWriteContract';
import { Droplet, Clock, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { formatEther } from 'ethers';

// Allow TypeScript to recognize the Web Component from AppKit
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

function App() {
  const { address, isConnected } = useAppKitAccount();
  const { getClaimableTime, getBalance, getFaucetAmount, getSymbol } = useReadContract();
  const { requestToken } = useWriteContract();

  const [balance, setBalance] = useState<string>('0');
  const [faucetAmount, setFaucetAmount] = useState<string>('0');
  const [symbol, setSymbol] = useState<string>('...');
  const [cooldown, setCooldown] = useState<number>(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchStats = async () => {
    try {
      if (address) {
        const bal = await getBalance(address as string);
        setBalance(formatEther(bal));
        
        const claim = await getClaimableTime(address as string);
        setCooldown(Number(claim));
      }
      
      const amt = await getFaucetAmount();
      setFaucetAmount(formatEther(amt));

      const sym = await getSymbol();
      setSymbol(sym);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  useEffect(() => {
    // Initial fetch for generic stats (symbol, faucet amount)
    fetchStats();
    
    // Set interval for user-specific stats
    if (isConnected && address) {
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    } else {
      setBalance('0');
      setCooldown(0);
    }
  }, [isConnected, address]);

  const handleClaim = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await requestToken();
      setMessage({ type: 'success', text: 'Tokens successfully claimed!' });
      fetchStats();
    } catch (error: any) {
      console.error(error);
      setMessage({ 
        type: 'error', 
        text: error?.reason || error?.info?.error?.message || error?.message || 'Transaction failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    if (seconds <= 0) return 'Ready to Claim!';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m remaining`;
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Droplet size={28} color="#e0c3fc" />
          <span>FaucetDApp</span>
        </div>
        <div className="auth-button">
          {/* AppKit Connect Button */}
          <appkit-button />
        </div>
      </header>

      <main className="main-content">
        <div className="hero">
          <h1>Claim your {symbol} Tokens</h1>
          <p>Get instant access to testnet liquidity. Connect your wallet and request your daily allocation of {faucetAmount} {symbol}.</p>
        </div>

        <div className="glass-card">
          <div className="stats-container">
            <div className="stat-row">
              <span className="stat-label">
                <Coins size={16} style={{display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom'}}/>
                Your Balance
              </span>
              <span className="stat-value">{Number(balance).toFixed(2)} {symbol}</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">
                <Clock size={16} style={{display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom'}}/>
                Status
              </span>
              <span className="stat-value" style={{ color: cooldown === 0 && isConnected ? '#2ecc71' : 'inherit' }}>
                {isConnected ? formatCooldown(cooldown) : 'Not Connected'}
              </span>
            </div>
          </div>

          <button 
            className={`btn-primary ${isLoading ? 'pulse' : ''}`}
            onClick={handleClaim}
            disabled={!isConnected || cooldown > 0 || isLoading}
          >
            {isLoading ? (
              <>Processing...</>
            ) : !isConnected ? (
              <>Connect Wallet to Claim</>
            ) : cooldown > 0 ? (
              <>In Cooldown</>
            ) : (
              <>
                <Droplet size={20} />
                Claim {faucetAmount} {symbol}
              </>
            )}
          </button>

          {message && (
            <div className={`message-box message-${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom'}}/> : <AlertCircle size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom'}}/>}
              {message.text}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
