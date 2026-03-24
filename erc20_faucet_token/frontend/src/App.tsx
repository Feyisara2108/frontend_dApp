import React, { useEffect, useMemo, useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { formatEther, getAddress, parseEther } from 'ethers';
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Coins,
  Copy,
  Droplets,
  Grid2x2,
  Shield,
  Wallet,
} from 'lucide-react';
import { APP_CONFIG, APP_CONFIG_ERROR } from './config/app';
import './App.css';
import { useReadContract } from './hooks/contracthooks/useReadContract';
import { useWriteContract } from './hooks/contracthooks/useWriteContract';
import { liskSepoliaNetwork } from './context/appkit';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

type Notice = { type: 'success' | 'error' | 'info'; text: string } | null;
type TabKey = 'dashboard' | 'faucet' | 'admin';

function parseContractError(error: unknown): string {
  const raw =
    (error as { reason?: string })?.reason ||
    (error as { info?: { error?: { message?: string } } })?.info?.error?.message ||
    (error as { message?: string })?.message ||
    '';

  if (raw.includes('Cooldown period not elapsed')) return 'Retry after your 24-hour faucet cooldown ends.';
  if (raw.includes('OnlyOwner') || raw.includes('caller is not the owner')) return 'Only the contract owner can perform this action.';
  if (raw.includes('Max supply reached')) return 'The faucet cannot mint more tokens because max supply has been reached.';
  if (raw.includes('Exceeds max supply')) return 'This mint would exceed the token max supply.';
  if (raw.includes('user rejected')) return 'The wallet request was rejected.';

  return raw || 'Transaction failed. Please try again.';
}

function formatTokenAmount(value: string, digits = 2) {
  return Number(value || '0').toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCompactAddress(value: string) {
  if (!value) return '--';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatCooldown(seconds: number) {
  if (seconds <= 0) return 'Ready now';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatRelativeClaim(lastClaim: number) {
  if (!lastClaim) return 'Never';
  const secondsAgo = Math.max(Math.floor(Date.now() / 1000) - lastClaim, 0);
  const hours = Math.floor(secondsAgo / 3600);
  const minutes = Math.floor((secondsAgo % 3600) / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function normalizeAddress(value: string) {
  return getAddress(value.trim());
}

function App() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const {
    getBalance,
    getClaimableTime,
    getFaucetAmount,
    getLastClaimTime,
    getMaxSupply,
    getName,
    getOwner,
    getSymbol,
    getTotalSupply,
  } = useReadContract();
  const { mint, requestToken, transferOwnership, transferTokens } = useWriteContract();

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [tokenName, setTokenName] = useState('KOMI');
  const [symbol, setSymbol] = useState('KMI');
  const [balance, setBalance] = useState('0');
  const [faucetAmount, setFaucetAmount] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [maxSupply, setMaxSupply] = useState('0');
  const [lastClaimTime, setLastClaimTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [owner, setOwner] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [nextOwner, setNextOwner] = useState('');

  const isWrongNetwork = useMemo(() => {
    if (!isConnected || !chainId) return false;
    return Number(chainId) !== APP_CONFIG.expectedChainId;
  }, [chainId, isConnected]);

  const isOwner = useMemo(() => {
    if (!address || !owner) return false;
    return address.toLowerCase() === owner.toLowerCase();
  }, [address, owner]);

  const supplyRatio = useMemo(() => {
    const total = Number(totalSupply || '0');
    const max = Number(maxSupply || '0');
    if (!max) return 0;
    return Math.min((total / max) * 100, 100);
  }, [maxSupply, totalSupply]);

  const fetchStaticStats = async () => {
    if (APP_CONFIG_ERROR) return;
    const [nameValue, symbolValue, faucetValue, totalValue, maxValue, ownerValue] = await Promise.all([
      getName(),
      getSymbol(),
      getFaucetAmount(),
      getTotalSupply(),
      getMaxSupply(),
      getOwner(),
    ]);

    setTokenName(nameValue);
    setSymbol(symbolValue);
    setFaucetAmount(formatEther(faucetValue));
    setTotalSupply(formatEther(totalValue));
    setMaxSupply(formatEther(maxValue));
    setOwner(ownerValue);
  };

  const fetchUserStats = async () => {
    if (!address || APP_CONFIG_ERROR || isWrongNetwork) {
      setBalance('0');
      setCooldown(0);
      setLastClaimTime(0);
      return;
    }

    const [balanceValue, cooldownValue, lastClaimValue] = await Promise.all([
      getBalance(address),
      getClaimableTime(address),
      getLastClaimTime(address),
    ]);

    setBalance(formatEther(balanceValue));
    setCooldown(Number(cooldownValue));
    setLastClaimTime(Number(lastClaimValue));
  };

  useEffect(() => {
    void fetchStaticStats().catch((error) => {
      console.error(error);
      setNotice({ type: 'error', text: 'Failed to load contract configuration.' });
    });
  }, []);

  useEffect(() => {
    void fetchUserStats().catch((error) => {
      console.error(error);
    });
  }, [address, isWrongNetwork]);

  useEffect(() => {
    if (!isConnected || isWrongNetwork) return undefined;
    const interval = window.setInterval(() => {
      void fetchStaticStats().catch(console.error);
      void fetchUserStats().catch(console.error);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [isConnected, isWrongNetwork, address]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timeout = window.setTimeout(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  const handleConnect = async () => {
    await open();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(liskSepoliaNetwork);
      setNotice({ type: 'success', text: `Wallet switched to ${APP_CONFIG.networkName}.` });
    } catch (error) {
      console.error(error);
      setNotice({ type: 'error', text: `Unable to switch to ${APP_CONFIG.networkName}. Switch your wallet manually.` });
    }
  };

  const ensureWalletReady = async () => {
    if (APP_CONFIG_ERROR) throw new Error(APP_CONFIG_ERROR);
    if (!isConnected) {
      await handleConnect();
      throw new Error('Connect your wallet to continue.');
    }
    if (isWrongNetwork) {
      await handleSwitchNetwork();
      throw new Error(`Switch to ${APP_CONFIG.networkName} to continue.`);
    }
  };

  const handleClaim = async () => {
    setNotice(null);
    setIsClaiming(true);
    try {
      await ensureWalletReady();
      await requestToken();
      setNotice({ type: 'success', text: `${faucetAmount} ${symbol} claimed successfully.` });
      await fetchStaticStats();
      await fetchUserStats();
      setActiveTab('faucet');
    } catch (error) {
      setNotice({ type: 'error', text: parseContractError(error) });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleTransfer = async () => {
    setNotice(null);
    setIsSending(true);
    try {
      await ensureWalletReady();
      const to = normalizeAddress(transferAddress);
      const amount = parseEther(transferAmount || '0');
      if (amount <= 0n) throw new Error('Enter a valid transfer amount.');
      await transferTokens(to, amount);
      setNotice({ type: 'success', text: `Sent ${transferAmount} ${symbol} to ${formatCompactAddress(to)}.` });
      setTransferAddress('');
      setTransferAmount('');
      await fetchUserStats();
    } catch (error) {
      setNotice({ type: 'error', text: parseContractError(error) });
    } finally {
      setIsSending(false);
    }
  };

  const handleMint = async () => {
    setNotice(null);
    setIsMinting(true);
    try {
      await ensureWalletReady();
      const to = normalizeAddress(mintAddress);
      const amount = parseEther(mintAmount || '0');
      if (amount <= 0n) throw new Error('Enter a valid mint amount.');
      await mint(to, amount);
      setNotice({ type: 'success', text: `Minted ${mintAmount} ${symbol} to ${formatCompactAddress(to)}.` });
      setMintAddress('');
      setMintAmount('');
      await fetchStaticStats();
      await fetchUserStats();
    } catch (error) {
      setNotice({ type: 'error', text: parseContractError(error) });
    } finally {
      setIsMinting(false);
    }
  };

  const handleTransferContractOwnership = async () => {
    setNotice(null);
    setIsTransferringOwnership(true);
    try {
      await ensureWalletReady();
      const normalized = normalizeAddress(nextOwner);
      await transferOwnership(normalized);
      setNotice({ type: 'success', text: `Ownership transferred to ${formatCompactAddress(normalized)}.` });
      setNextOwner('');
      await fetchStaticStats();
    } catch (error) {
      setNotice({ type: 'error', text: parseContractError(error) });
    } finally {
      setIsTransferringOwnership(false);
    }
  };

  const useMaxBalance = () => setTransferAmount(balance);
  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setNotice({ type: 'info', text: 'Wallet address copied to clipboard.' });
  };

  return (
    <div className="komi-shell">
      <div className="komi-grid" />
      <header className="komi-header">
        <div className="komi-brand">
          <div className="komi-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>KOMI</strong>
            <p>{tokenName} on {APP_CONFIG.networkName}</p>
          </div>
        </div>
        <button className="wallet-cta" onClick={() => { void handleConnect(); }}>
          <Wallet size={18} />
          {isConnected && address ? formatCompactAddress(address) : 'Connect Wallet'}
        </button>
      </header>

      <main className="komi-main">
        {APP_CONFIG_ERROR && <div className="notice notice-error">{APP_CONFIG_ERROR}</div>}
        {!APP_CONFIG_ERROR && notice && <div className={`notice notice-${notice.type}`}>{notice.text}</div>}
        {isConnected && isWrongNetwork && !APP_CONFIG_ERROR && (
          <div className="notice notice-error">
            Wrong network detected. Switch your wallet to {APP_CONFIG.networkName}.
          </div>
        )}

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Architectural Ledger</p>
            <h1>KOMI Faucet</h1>
            <p className="hero-text">
              Claim free {symbol} tokens every 24 hours, move assets between wallets, and manage the live faucet from one unified hub.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => { void handleConnect(); }}>
                <Wallet size={18} />
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </button>
              <button className="secondary-button" onClick={() => setActiveTab('dashboard')}>
                Enter App
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="hero-stats-card">
            <div>
              <span className="mini-label">Available</span>
              <strong>{formatTokenAmount(balance)} {symbol}</strong>
            </div>
            <div>
              <span className="mini-label">Next Claim</span>
              <strong className={cooldown > 0 ? 'warm' : 'cool'}>{formatCooldown(cooldown)}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-layout">
          <div className="main-column">
            {activeTab === 'dashboard' && (
              <>
                <section className="panel wallet-panel">
                  <div className="panel-heading compact">
                    <span className="eyebrow">Active Wallet</span>
                    {address && (
                      <button className="icon-button" onClick={() => { void copyAddress(); }}>
                        <Copy size={16} />
                      </button>
                    )}
                  </div>
                  <p className="wallet-address">{address ? formatCompactAddress(address) : 'Not connected'}</p>
                  <div className="balance-row">
                    <span className="mini-label">Total Balance</span>
                    <h2>{formatTokenAmount(balance)} {symbol}</h2>
                  </div>
                </section>

                <section className="panel faucet-panel">
                  <div className="panel-heading">
                    <div className="panel-title-with-icon">
                      <div className="soft-icon soft-icon-peach"><Droplets size={20} /></div>
                      <div>
                        <h3>{symbol} Faucet</h3>
                        <p>Daily distribution protocol</p>
                      </div>
                    </div>
                  </div>
                  <div className="faucet-metrics">
                    <div>
                      <span className="mini-label">Claimable</span>
                      <strong>{formatTokenAmount(faucetAmount)} {symbol}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Cooldown</span>
                      <strong className={cooldown > 0 ? 'warm' : 'cool'}>{formatCooldown(cooldown)}</strong>
                    </div>
                  </div>
                  <button
                    className="primary-button full-width"
                    disabled={isClaiming || (isConnected && !isWrongNetwork && cooldown > 0)}
                    onClick={() => { void handleClaim(); }}
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Tokens'}
                  </button>
                  <p className="helper-row"><BadgeCheck size={16} /> Tokens will be sent to your connected wallet instantly.</p>
                </section>

                <section className="panel transfer-panel">
                  <div className="panel-heading">
                    <h3>Internal Transfer</h3>
                  </div>
                  <label className="field-label">Recipient Address</label>
                  <input className="field-input" placeholder="0x..." value={transferAddress} onChange={(e) => setTransferAddress(e.target.value)} />
                  <label className="field-label">Amount ({symbol})</label>
                  <div className="field-with-action">
                    <input className="field-input" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
                    <button className="inline-action" onClick={useMaxBalance}>MAX</button>
                  </div>
                  <button className="primary-button full-width" disabled={isSending} onClick={() => { void handleTransfer(); }}>
                    {isSending ? 'Sending...' : 'Send Tokens'}
                  </button>
                </section>
              </>
            )}

            {activeTab === 'faucet' && (
              <section className="panel faucet-landing">
                <div className="hero-copy center-copy">
                  <p className="eyebrow">Daily Access</p>
                  <h1>{tokenName} Faucet</h1>
                  <p className="hero-text">
                    Claim free {symbol} tokens every 24 hours to explore the architectural ledger.
                  </p>
                  <div className="hero-actions stacked-actions">
                    <button className="primary-button" onClick={() => { void handleConnect(); }}>
                      <Wallet size={18} />
                      {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                    </button>
                    <button className="secondary-button" onClick={() => setActiveTab('dashboard')}>
                      Enter App
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="hero-stats-card centered-card">
                  <div>
                    <span className="mini-label">Available</span>
                    <strong>{formatTokenAmount(balance)} {symbol}</strong>
                  </div>
                  <div>
                    <span className="mini-label">Next Claim</span>
                    <strong className={cooldown > 0 ? 'warm' : 'cool'}>{formatCooldown(cooldown)}</strong>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'admin' && (
              <section className="panel admin-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Global Stats</p>
                    <h3>Admin Console</h3>
                  </div>
                  <span className={`pill ${isOwner ? 'pill-live' : 'pill-restricted'}`}>{isOwner ? 'OWNER' : 'RESTRICTED'}</span>
                </div>

                <div className="supply-card">
                  <div className="panel-title-with-icon">
                    <div className="soft-icon soft-icon-blue"><Blocks size={20} /></div>
                    <div>
                      <span className="mini-label">Total {symbol} Supply</span>
                      <strong>{formatTokenAmount(totalSupply, 0)}</strong>
                    </div>
                  </div>
                  <div className="progress-rail">
                    <span style={{ width: `${supplyRatio}%` }} />
                  </div>
                  <div className="progress-meta">
                    <span>{supplyRatio.toFixed(0)}%</span>
                    <span>{formatTokenAmount(maxSupply, 0)} {symbol} cap</span>
                  </div>
                </div>

                <div className="stat-grid-two">
                  <div className="stat-card">
                    <span className="mini-label">Max Supply Cap</span>
                    <strong>{formatTokenAmount(maxSupply, 0)} {symbol}</strong>
                  </div>
                  <div className="stat-card">
                    <span className="mini-label">Current Owner</span>
                    <strong>{formatCompactAddress(owner)}</strong>
                  </div>
                </div>

                <div className="admin-form-card">
                  <div className="panel-title-with-icon">
                    <div className="soft-icon soft-icon-lilac"><Coins size={20} /></div>
                    <div>
                      <h4>Mint Tokens</h4>
                      <p>Owner-only mint function</p>
                    </div>
                  </div>
                  <label className="field-label">Recipient Address</label>
                  <input className="field-input" placeholder="0x..." value={mintAddress} onChange={(e) => setMintAddress(e.target.value)} />
                  <label className="field-label">Amount</label>
                  <input className="field-input" placeholder={`0.00 ${symbol}`} value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} />
                  <button className="primary-button full-width" disabled={isMinting || !isOwner} onClick={() => { void handleMint(); }}>
                    {isMinting ? 'Minting...' : 'Mint Tokens'}
                  </button>
                </div>

                <div className="admin-form-card">
                  <div className="panel-title-with-icon">
                    <div className="soft-icon soft-icon-slate"><Shield size={20} /></div>
                    <div>
                      <h4>Ownership</h4>
                      <p>Contract administrator handover</p>
                    </div>
                  </div>
                  <div className="owner-box">{owner || '--'}</div>
                  <label className="field-label">New Owner Address</label>
                  <input className="field-input" placeholder="Transfer to..." value={nextOwner} onChange={(e) => setNextOwner(e.target.value)} />
                  <button className="secondary-button full-width" disabled={isTransferringOwnership || !isOwner} onClick={() => { void handleTransferContractOwnership(); }}>
                    {isTransferringOwnership ? 'Transferring...' : 'Transfer Ownership'}
                  </button>
                </div>
              </section>
            )}
          </div>

          <aside className="side-column">
            <section className="panel integrity-panel">
              <div className="panel-heading compact">
                <h3>System Integrity</h3>
              </div>
              <div className="integrity-row"><span>Oracle Connectivity</span><strong className="status-live">99.8%</strong></div>
              <div className="integrity-row"><span>Gas Optimization</span><strong>Low</strong></div>
              <div className="integrity-row"><span>Protocol Latency</span><strong>12ms</strong></div>
              <div className="integrity-row"><span>Last Claim</span><strong>{formatRelativeClaim(lastClaimTime)}</strong></div>
            </section>
          </aside>
        </section>
      </main>

      <nav className="bottom-nav">
        <button className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('dashboard')}>
          <Grid2x2 size={18} />
          <span>Dashboard</span>
        </button>
        <button className={activeTab === 'faucet' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('faucet')}>
          <Droplets size={18} />
          <span>Faucet</span>
        </button>
        <button className={activeTab === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('admin')}>
          <Shield size={18} />
          <span>Admin</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
