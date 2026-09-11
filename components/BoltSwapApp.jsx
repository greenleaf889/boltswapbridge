'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { chains, tokens, defaultBridges, defaultExchanges } from '@/lib/data';
import { receiveAmountFormatted } from '@/lib/format';
import { useQuote } from '@/hooks/useQuote';
import BackgroundCanvas from './BackgroundCanvas';

const LoadingFallback = () => <div className="loading-fallback">Loading...</div>;

import EarnSection from './EarnSection';
import PortfolioSection from './PortfolioSection';
import MissionsSection from './MissionsSection';
const TokenSelectModal = dynamic(() => import('./TokenSelectModal'), {
  loading: LoadingFallback,
});
const SendToWalletModal = dynamic(() => import('./SendToWalletModal'), {
  loading: LoadingFallback,
});
const ConnectWalletModal = dynamic(() => import('./ConnectWalletModal'), {
  loading: LoadingFallback,
});
const SettingsModal = dynamic(() => import('./SettingsModal'), {
  loading: LoadingFallback,
});
const ScanTransactionsModal = dynamic(() => import('./ScanTransactionsModal'), {
  loading: LoadingFallback,
});

import Navbar from './Navbar';
import QuickToolbar from './QuickToolbar';
import SwapCard from './SwapCard';

function defaultSettings() {
  return {
    routePriority: 'Best Return',
    gasPrice: 'Normal',
    slippage: 'Auto',
    hideSmallBalances: false,
    bridges: defaultBridges,
    exchanges: defaultExchanges,
    bridgesEnabled: new Set(defaultBridges),
    exchangesEnabled: new Set(defaultExchanges),
  };
}

const PLACEHOLDER_ADDRESS = '0x1111111111111111111111111111111111111111';

export default function BoltSwapApp({ initialSection = 'trade', onBackToHome }) {
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [sendAmount, setSendAmount] = useState('');
  const [quickView, setQuickView] = useState('swap');
  const [activeSection, setActiveSection] = useState(initialSection);
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [connectedLabel, setConnectedLabel] = useState(null);
  const [walletAddress, setWalletAddress] = useState(PLACEHOLDER_ADDRESS);
  const [destinationWallet, setDestinationWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showRoute, setShowRoute] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // { type: 'token'|'send'|'connect'|'settings'|'scan', field? }

  useEffect(() => {
    const preload = () => {
      import('./TokenSelectModal');
      import('./SendToWalletModal');
      import('./ConnectWalletModal');
      import('./SettingsModal');
      import('./ScanTransactionsModal');
    };
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = window.setTimeout(preload, 250);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Restore state from the URL on first load (shareable swap links).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromChainId = params.get('fromChain');
    const fromTokenAddr = params.get('fromToken');
    const toChainId = params.get('toChain');
    const toTokenAddr = params.get('toToken');
    const amount = params.get('fromAmount');

    if (fromChainId && fromTokenAddr) {
      const token = tokens.find((t) => t.chain === parseInt(fromChainId, 10) && t.address === fromTokenAddr);
      if (token) setFromToken(token);
    }
    if (toChainId && toTokenAddr) {
      const token = tokens.find((t) => t.chain === parseInt(toChainId, 10) && t.address === toTokenAddr);
      if (token) setToToken(token);
    }
    if (amount) setSendAmount(amount);
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync with the current swap so it stays shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (fromToken) {
      params.set('fromChain', fromToken.chain);
      params.set('fromToken', fromToken.address);
    }
    if (toToken) {
      params.set('toChain', toToken.chain);
      params.set('toToken', toToken.address);
    }
    if (sendAmount) params.set('fromAmount', sendAmount);
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [fromToken, toToken, sendAmount]);

  const { routes, loading: quoteLoading } = useQuote({
    fromToken,
    toToken,
    sendAmount,
    walletAddress,
    routePriority: settings.routePriority,
    settings,
  });

  function handleSwapDirection() {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuickView('swap');
  }

  function handlePercentageClick(percent, mockBalance) {
    setSendAmount(((mockBalance * percent) / 100).toString());
    setSelectedPercentage(percent);
  }

  function handleSelectToken(token) {
    if (activeModal?.field === 'from') setFromToken(token);
    else setToToken(token);
    setActiveModal(null);
  }

  function handleConnect(label, address) {
    setConnectedLabel(`Connected (${label})`);
    if (address) {
      setWalletAddress(address);
    }
    setActiveModal(null);
    fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'user_action',
        severity: 'info',
        message: 'Wallet connected',
        data: {
          action: 'connect_wallet',
          wallet: label,
          walletAddress: address || null,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch((reportError) => console.error('[wallet report]', reportError));
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 }, colors: ['#8b5cf6', '#06b6d4', '#4ade80'] });
  }

  async function handleActionClick() {
    if (!connectedLabel) {
      setActiveModal({ type: 'connect' });
      return;
    }

    if (!fromToken || !toToken || !sendAmount || Number(sendAmount) <= 0) {
      return;
    }

    const payload = {
      fromToken,
      toToken,
      sendAmount,
      walletAddress,
      destination: destinationWallet || walletAddress,
      routePriority: settings.routePriority,
      settings,
    };

    try {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Swap API returned ${response.status}`);
      }

      const data = await response.json();
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'transaction',
          severity: 'info',
          message: destinationWallet
            ? `Send to wallet completed: ${payload.destination}`
            : 'Swap completed',
          data: {
            action: destinationWallet ? 'send_to_wallet' : 'swap',
            fromToken: fromToken.sym,
            toToken: toToken.sym,
            amount: sendAmount,
            walletAddress,
            destination: payload.destination,
            status: 'completed',
            requestId: data.requestId,
          },
        }),
      });
      const now = new Date();
      const newTx = {
        id: `${now.getTime()}-${transactions.length}`,
        txHash: data.requestId,
        timestamp: now.toISOString(),
        timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fromToken: `${sendAmount} ${fromToken.sym}`,
        toToken: `${data.bestRoute?.toAmount?.toFixed(4) || '0.00'} ${toToken?.sym || ''}`.trim(),
        via: data.bestRoute?.bridgeName || data.bestRoute?.engineId || 'Swap/Bridge',
        status: 'Completed',
        destination: payload.destination,
      };

      setTransactions((prev) => [newTx, ...prev].slice(0, 20));
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#ffffff'] });
    } catch (err) {
      console.error('[handleActionClick]', err?.message || err);
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'transaction',
          severity: 'high',
          message: 'Swap failed',
          data: {
            fromToken: fromToken?.sym || null,
            toToken: toToken?.sym || null,
            amount: sendAmount,
            walletAddress,
            status: 'failed',
            error: err?.message || 'Unknown swap error',
          },
        }),
      }).catch((reportError) => console.error('[swap report]', reportError));
    }
  }

  function handleConfirmSendToWallet(address) {
    setDestinationWallet(address);
    setActiveModal(null);
    fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'user_action',
        severity: 'info',
        message: `Send to wallet selected: ${address}`,
        data: {
          action: 'send_to_wallet',
          destination: address,
          walletAddress,
          status: 'selected',
          timestamp: new Date().toISOString(),
        },
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          console.error('[send wallet report]', response.status, await response.text());
        }
      })
      .catch((reportError) => console.error('[send wallet report]', reportError));
  }

  return (
    <div className="app-container">
      <BackgroundCanvas />
      <Navbar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        connectedLabel={connectedLabel}
        onOpenConnect={() => setActiveModal({ type: 'connect' })}
        onOpenScan={() => setActiveModal({ type: 'scan' })}
        onGoHome={onBackToHome}
      />

      <div className="content-row">
        {activeSection === 'earn' ? (
          <EarnSection />
        ) : activeSection === 'portfolio' ? (
          <PortfolioSection onOpenTrade={() => setActiveSection('trade')} />
        ) : activeSection === 'missions' ? (
          <MissionsSection />
        ) : (
          <>
            <QuickToolbar
              quickView={quickView}
              onSwapDirection={() => { handleSwapDirection(); setQuickView('swap'); }}
              onSetGasView={() => setQuickView('gas')}
            />
            <div className="page-content">
              <SwapCard
                fromToken={fromToken}
                toToken={toToken}
                sendAmount={sendAmount}
                onSendAmountChange={setSendAmount}
                onOpenTokenModal={(field) => setActiveModal({ type: 'token', field })}
                onSwapDirection={handleSwapDirection}
                selectedPercentage={selectedPercentage}
                onPercentageClick={handlePercentageClick}
                quickView={quickView}
                settings={settings}
                onSetGasPrice={(val) => setSettings((s) => ({ ...s, gasPrice: val }))}
                onOpenSettings={() => setActiveModal({ type: 'settings' })}
                routes={routes}
                quoteLoading={quoteLoading}
                showRoute={showRoute}
                onToggleShowRoute={() => setShowRoute((v) => !v)}
                destinationWallet={destinationWallet}
                onOpenSendToWallet={() => setActiveModal({ type: 'send' })}
                connectedLabel={connectedLabel}
                onActionClick={handleActionClick}
              />
            </div>
          </>
        )}
      </div>

      {activeModal?.type === 'token' && (
        <TokenSelectModal
          field={activeModal.field}
          defaultChainId={activeModal.field === 'from' ? fromToken?.chain : toToken?.chain}
          onClose={() => setActiveModal(null)}
          onSelect={handleSelectToken}
        />
      )}
      {activeModal?.type === 'send' && (
        <SendToWalletModal
          initialValue={destinationWallet}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmSendToWallet}
          connectedWalletAddress={connectedLabel && walletAddress !== PLACEHOLDER_ADDRESS ? walletAddress : null}
          connectedWalletLabel={connectedLabel}
        />
      )}
      {activeModal?.type === 'connect' && (
        <ConnectWalletModal
          onClose={() => setActiveModal(null)}
          onConnect={handleConnect}
        />
      )}
      {activeModal?.type === 'scan' && (
        <ScanTransactionsModal
          onClose={() => setActiveModal(null)}
          transactions={transactions}
        />
      )}
      {activeModal?.type === 'settings' && (
        <SettingsModal
          settings={settings}
          onClose={() => setActiveModal(null)}
          onChange={setSettings}
        />
      )}
    </div>
  );
}
