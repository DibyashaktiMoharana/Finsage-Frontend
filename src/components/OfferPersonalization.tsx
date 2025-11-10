'use client';

import React, { useState, useEffect, CSSProperties, useRef } from 'react';
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  SkeletonText,
  Loading,
  ProgressBar,
  Modal,
} from '@carbon/react';
import {
  Gift,
  Money,
  Calendar,
  Information,
  ChevronRight,
  Checkmark,
  ChevronDown,
} from '@carbon/icons-react';
import styles from './styles/OfferPersonalization.module.css';

// IBM Carbon Colors
const ibmColors = {
  blue: '#0f62fe',
  coolGray: '#f4f4f4',
  gray: '#e0e0e0',
  darkGray: '#8d8d8d',
  text: '#161616',
  white: '#ffffff',
};

// Add CSS animation for bounce effect
const bounceAnimation = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-4px);
    }
    60% {
      transform: translateY(-2px);
    }
  }
  
  @keyframes movingDottedBorder {
    0% {
      border-color: #ffd700;
      box-shadow: 0 0 8px rgba(255,215,0,0.4);
    }
    50% {
      border-color: #ffed4e;
      box-shadow: 0 0 12px rgba(255,215,0,0.6);
    }
    100% {
      border-color: #ffd700;
      box-shadow: 0 0 8px rgba(255,215,0,0.4);
    }
  }
`;

// Inject the animation into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = bounceAnimation;
  document.head.appendChild(style);
}

interface Offer {
  id?: string | number;
  Id?: string | number;
  title: string;
  category: string;
  brand: string;
  code?: string;
  validTill?: string;
  progress?: number;
  currentSpending?: string;
  amountNeeded?: string;
  imageUrl?: string;
  image_url?: string;
  detailUrl?: string;
  relevance?: string;
  recommendation?: string;
  potentialSavings?: string;
  offer_type?: string;
  current_spending?: number;
  amount_needed?: number;
  minimum_amount?: number;
  savings?: number;
  description?: string;
  payment?: string;
  duration?: string;
  type?: string;
  offerDetails?: string;
  howToRedeem?: string;
  termsAndConditions?: string;
  availOfferLink?: string;
  avail_offer_link?: string;
  avail_url?: string;
  terms_and_conditions?: string;
  how_to_redeem?: string;
  valid_till?: string;
  offer_details?: string;
  spending_target?: number;
  is_transaction_based?: boolean;
  reward_type?: string;
  reward_text?: string;
  confidence?: number;
  ai_analysis?: {
    time_period?: string;
  };
}

interface OfferPersonalizationProps {
  loading: boolean;
  onetimeOffers: Offer[];
  progressiveOffers: Offer[];
}

function parseOfferCodes(code: string) {
  const regex = /([^\-\n]+?)\s*-\s*([A-Z0-9]{6,})/g;
  const matches = [];
  let match;
  while ((match = regex.exec(code)) !== null) {
    matches.push({ label: match[1].trim(), code: match[2].trim() });
  }
  if (matches.length > 0) {
    return matches;
  }
  // Fallback: Split by | or newlines
  const parts = code.split(/\s*\|\s*|\n/);
  return parts.map((part) => {
    const trimmedPart = part.trim();
    const colonIndex = trimmedPart.indexOf(':');
    if (colonIndex !== -1) {
      const label = trimmedPart.substring(0, colonIndex).trim();
      const code = trimmedPart.substring(colonIndex + 1).trim();
      return { label, code };
    }
    const dashIndex = trimmedPart.lastIndexOf(' - ');
    if (dashIndex !== -1) {
      const label = trimmedPart.substring(0, dashIndex).trim();
      const code = trimmedPart.substring(dashIndex + 3).trim();
      return { label, code };
    }
    return { label: '', code: trimmedPart };
  }).filter(c => c.code && c.code.length > 0);
}

// Helper to convert time period to months string
function getMonthsString(timePeriod?: string): string | null {
  if (!timePeriod) return null;
  const lower = timePeriod.toLowerCase();
  if (lower === 'monthly') return '1 month';
  if (lower === 'quarterly') return '3 months';
  if (lower === 'annually' || lower === 'annual' || lower === 'yearly') return '12 months';
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (monthMatch) return `${monthMatch[1]} month${monthMatch[1] === '1' ? '' : 's'}`;
  const yearMatch = lower.match(/(\d+)\s*year/);
  if (yearMatch) {
    const months = parseInt(yearMatch[1], 10) * 12;
    return `${months} months`;
  }
  return timePeriod;
}

const OfferCard: React.FC<{ offer: Offer }> = ({ offer }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, codeToCopy: string) => {
    e.stopPropagation();
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(codeToCopy);
      setTimeout(() => setCopiedCode(null), 1400);
    }
  };

  const cardStyle: CSSProperties = {
    padding: 0,
    backgroundColor: ibmColors.white,
    minHeight: '360px',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${ibmColors.gray}`,
    boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
  };

  // Use image_url for one-time offers, /bob.png for progressive
  const isProgressive = offer.offer_type === 'progressive' || 
                       (offer.spending_target !== undefined && offer.savings !== undefined);
  const imgSrc = isProgressive ? '/bob.png' : (offer.image_url || offer.imageUrl || '/bob.png');

  return (
    <>
      <Tile
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div style={{ height: '160px', backgroundColor: ibmColors.coolGray, position: 'relative', overflow: 'hidden', width: '100%' }}>
          <img
            src={imgSrc}
            alt={offer.title}
            style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            onError={e => { e.currentTarget.src = '/bob.png'; }}
          />
        </div>
        
        {/* Progress Bar for Progressive Offers - moved below image */}
        {isProgressive && offer.spending_target !== undefined && offer.spending_target > 0 && (
          <div style={{ margin: '0', width: '100%' }}>
            <div style={{
              width: '100%',
              height: '28px',
              background: '#e0e0e0',
              borderRadius: '0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderBottom: '1px solid #d0d0d0'
            }}>
              <div style={{
                width: `${Math.min(100, Math.round(offer.progress || (offer.current_spending || 0) / (offer.spending_target || 1) * 100))}%`,
                height: '100%',
                background: (() => {
                  const percentage = Math.round(offer.progress || (offer.current_spending || 0) / (offer.spending_target || 1) * 100);
                  if (percentage >= 90) return '#24a148'; // Green for 90%+
                  if (percentage >= 30) return '#0f62fe'; // Blue for 30%+
                  if (percentage >= 15) return '#f1c21b'; // Yellow for 15%+
                  return '#da1e28'; // Red for low progress (below 15%)
                })(),
                borderRadius: '0',
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  lineHeight: '28px',
                  width: '100%',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}>
                  {`${Math.min(100, Math.round(offer.progress || (offer.current_spending || 0) / (offer.spending_target || 1) * 100))}%`}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#161616', textAlign: 'center', fontWeight: 500, padding: '0 1rem' }}>
              {offer.is_transaction_based ? (
                `${offer.current_spending || 0} / ${offer.spending_target || 0} transactions`
              ) : (
                (() => {
                  const current = (offer.current_spending || 0);
                  const target = (offer.spending_target || 0);
                  const percentage = Math.round((current / target) * 100);
                  if (percentage < 5 && target > 10000) {
                    return `₹${(current/1000).toFixed(1)}K / ₹${(target/1000).toFixed(0)}K`;
                  } else if (percentage < 5 && target > 1000) {
                    return `₹${current.toFixed(0)} / ₹${(target/1000).toFixed(1)}K`;
                  } else {
                    return `₹${current.toLocaleString()} / ₹${target.toLocaleString()}`;
                  }
                })()
              )}
              {/* Show number of months if available from backend analysis */}
              {offer.ai_analysis?.time_period && offer.ai_analysis.time_period !== 'lifetime' && (
                <span style={{ color: '#8d8d8d', fontSize: '0.85em', marginLeft: 6 }}>
                  ({getMonthsString(offer.ai_analysis.time_period)})
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Content Section */}
        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Brand, Title, Description */}
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: ibmColors.darkGray, margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>{offer.brand}</p>
              {/* Title and Category Tag - same layout as one-time offers */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '0.25rem 0 0.5rem 0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: ibmColors.text, margin: 0, lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                  {offer.title}
                </h4>
                {offer.category && <Tag type="blue" size="sm" style={{ margin: 0, alignSelf: 'flex-start', flexShrink: 0 }}>{offer.category}</Tag>}
              </div>
              {offer.code && !isProgressive && (
                <div style={{ fontWeight: 600, color: '#0f62fe', marginBottom: '0.5rem' }}>Code: {offer.code}</div>
              )}
              {offer.description && <p style={{ fontSize: '0.92rem', color: ibmColors.darkGray, margin: 0, marginBottom: '0.5rem' }}>{offer.description}</p>}
            </div>
            
            {/* Valid Till */}
            {offer.validTill && (
              <div style={{ fontSize: '0.9rem', color: ibmColors.darkGray, marginBottom: '0.25rem' }}>
                <Calendar size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Valid Till: {offer.validTill}
              </div>
            )}
          </div>
          
          {/* Savings for Progressive Offers - Moved to bottom */}
          {isProgressive && offer.savings && (
            <div style={{ 
              fontSize: '1.1rem', 
              color: '#24a148', 
              marginTop: 'auto',
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              border: '2px dotted #ffd700',
              borderRadius: '6px',
              padding: '0.5rem',
              background: 'rgba(255, 215, 0, 0.1)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>Rewards:</span>
              {(() => {
                const savings = offer.savings || 0;
                const rewardType = offer.reward_type || 'unknown';
                
                if (rewardType === 'points') {
                  return (
                    <>
                      <span style={{ fontSize: '1.4rem', color: '#ffd700' }}>🟡</span>
                      <span>+{savings.toLocaleString()} pts</span>
                    </>
                  );
                } else {
                  return (
                    <>
                      <Money size={18} style={{ fill: '#24a148' }} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1rem' }}>+₹{savings.toLocaleString()}</span>
                    </>
                  );
                }
              })()}
            </div>
          )}
        </div>
      </Tile>
      {/* More Details Modal */}
      {/* Removed modal component from here */}
    </>
  );
};

const OfferPersonalization: React.FC<OfferPersonalizationProps> = ({ loading, onetimeOffers, progressiveOffers }) => {
  const [activeTab, setActiveTab] = useState<'progressive' | 'one_time' | 'all'>('one_time');
  const [activeModalOffer, setActiveModalOffer] = useState<Offer | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savingsTab, setSavingsTab] = useState<'all' | 'discount' | 'cashback' | 'points'>('all');

  const summaryItemsScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    const el = summaryItemsScrollRef.current;
    if (!el) return;
    const checkScroll = () => {
      setShowScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    };
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  if (loading) {
    return <div className={styles.loadingContainer}>Loading offers...</div>;
  }

  if (onetimeOffers.length === 0 && progressiveOffers.length === 0) {
    return (
      <div className={styles.noOffersContainer}>
        <Tile className={styles.noOffersTile}>
          <Gift size={48} className={styles.noOffersIcon} />
          <h3 className={styles.noOffersTitle}>No Offers Available</h3>
          <p className={styles.noOffersText}>
            We couldn't find any personalized offers for you at the moment.
            <br />
            Please check back later!
          </p>
        </Tile>
      </div>
    );
  }

  // Calculate summary data
  const allOffers = [...progressiveOffers, ...onetimeOffers];
  
  // Categorize offers by reward type
  const discountOffers = allOffers.filter(offer => 
    offer.reward_type === 'discount_fixed' || offer.reward_type === 'discount_percent' ||
    (offer.savings && offer.savings > 0 && !offer.reward_type && 
     (offer.offer_details?.toLowerCase().includes('discount') || 
      offer.offer_details?.toLowerCase().includes('off')))
  );
  
  const cashbackOffers = allOffers.filter(offer => 
    offer.reward_type === 'cashback' ||
    (offer.savings && offer.savings > 0 && !offer.reward_type && 
     offer.offer_details?.toLowerCase().includes('cashback'))
  );
  
  const pointsOffers = allOffers.filter(offer => 
    offer.reward_type === 'points' ||
    (offer.savings && offer.savings > 0 && !offer.reward_type && 
     (offer.offer_details?.toLowerCase().includes('point') || 
      offer.offer_details?.toLowerCase().includes('bonus')))
  );
  
  // Calculate totals for each type (move these above the return for use in JSX)
  const totalMoneySavings = discountOffers.reduce((sum, offer) => {
    const rewardType = offer.reward_type || 'unknown';
    return sum + (rewardType !== 'points' ? (offer.savings || 0) : 0);
  }, 0) + cashbackOffers.reduce((sum, offer) => sum + (offer.savings || 0), 0);
  const totalPoints = pointsOffers.reduce((sum, offer) => sum + (offer.savings || 0), 0);
  
  // Filter offers based on active savings tab
  const filteredOffers = savingsTab === 'all' ? allOffers :
    savingsTab === 'discount' ? discountOffers :
    savingsTab === 'cashback' ? cashbackOffers :
    savingsTab === 'points' ? pointsOffers :
    allOffers; // fallback to all offers
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.offersColumn}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
            type="button"
            onClick={() => setActiveTab('one_time')}
            disabled={onetimeOffers.length === 0}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '4px',
              border: activeTab === 'one_time' ? '2px solid #0f62fe' : '1px solid #e0e0e0',
              background: activeTab === 'one_time' ? '#e8f0fe' : '#fff',
              color: onetimeOffers.length === 0 ? '#b0b0b0' : '#161616',
              fontWeight: 600,
              cursor: onetimeOffers.length === 0 ? 'not-allowed' : 'pointer',
              outline: 'none',
              fontSize: '1rem',
              transition: 'all 0.2s',
              opacity: onetimeOffers.length === 0 ? 0.5 : 1,
            }}
          >
            Personalized Offers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('progressive')}
            disabled={progressiveOffers.length === 0}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '4px',
              border: activeTab === 'progressive' ? '2px solid #0f62fe' : '1px solid #e0e0e0',
              background: activeTab === 'progressive' ? '#e8f0fe' : '#fff',
              color: progressiveOffers.length === 0 ? '#b0b0b0' : '#161616',
              fontWeight: 600,
              cursor: progressiveOffers.length === 0 ? 'not-allowed' : 'pointer',
              outline: 'none',
              fontSize: '1rem',
              transition: 'all 0.2s',
              opacity: progressiveOffers.length === 0 ? 0.5 : 1,
            }}
          >
            Benefits Tracker
          </button>
        </div>
        <div className={styles.offersGrid}>
          {activeTab === 'progressive' && progressiveOffers.map((offer, index) => {
            const uniqueKey = `progressive-${offer.id || offer.Id || `no-id-${index}`}-${index}`;
            return <OfferCard key={uniqueKey} offer={offer} />;
          })}
          {activeTab === 'one_time' && onetimeOffers.map((offer, index) => {
            const uniqueKey = `one-time-${offer.id || offer.Id || `no-id-${index}`}-${index}`;
            return (
              <Tile key={uniqueKey} className={styles.offerTile} style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              {/* Image Section - direct child, flush with tile borders */}
              <img
                src={offer.image_url || offer.imageUrl || '/bob.png'}
                alt={offer.title}
                style={{ width: '100%', height: '160px', objectFit: 'fill', display: 'block', margin: 0, padding: 0, borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
                onError={e => { e.currentTarget.src = '/bob.png'; }}
              />
              {/* Content Section - spacing only below image */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>
                <div>
                  {/* Brand Name */}
                  <p style={{ fontSize: '0.85rem', color: ibmColors.darkGray, margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>{offer.brand}</p>
                  
                  {/* Top Row: Title and Category Tag */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, margin: '0.25rem 0 0.5rem 0' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: ibmColors.text, margin: 0, lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                      {offer.title}
                    </h4>
                    {offer.category && <Tag type="blue" size="sm" style={{ margin: 0, alignSelf: 'flex-start', flexShrink: 0, minHeight: '20px' }}>{offer.category}</Tag>}
                  </div>
                  {offer.description && (
                    <p style={{ fontSize: '0.92rem', color: ibmColors.darkGray, margin: 0, marginBottom: '0.5rem', overflowWrap: 'anywhere' }}>
                      {offer.description}
                      {((offer.termsAndConditions || offer.terms_and_conditions || offer.howToRedeem || offer.how_to_redeem)) && (
                        <span
                          style={{ color: ibmColors.blue, textDecoration: 'underline', cursor: 'pointer', marginLeft: 8, fontSize: '0.92rem', fontWeight: 500 }}
                          onClick={e => {
                            e.stopPropagation();
                            setActiveModalOffer(offer);
                          }}
                        >
                          More Details
                        </span>
                      )}
                    </p>
                  )}
                  {/* Code(s) under title/desc */}
                  {offer.code && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '0.25rem 0' }}>
                      {parseOfferCodes(offer.code).map((item, idx) => (
                        <span key={item.code + idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {item.label && <span style={{ fontSize: '0.78em', color: ibmColors.darkGray, marginRight: '0.2em', whiteSpace: 'nowrap' }}>{item.label}:</span>}
                          <span
                            onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(item.code); setCopiedCode(item.code); setTimeout(() => setCopiedCode(null), 1400); }}
                            style={{
                              border: copiedCode === item.code ? '2px solid #24a148' : '2px dotted #24a148',
                              borderRadius: '4px',
                              padding: '0.05rem 0.35rem',
                              color: copiedCode === item.code ? '#fff' : '#24a148',
                              fontWeight: 500,
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              background: copiedCode === item.code ? '#24a148' : 'rgba(36,161,72,0.07)',
                              wordBreak: 'break-all',
                              whiteSpace: 'normal',
                              display: 'inline-flex',
                              alignItems: 'center',
                              position: 'relative',
                              transition: 'background 0.3s, color 0.3s, border 0.3s, padding-right 0.3s cubic-bezier(0.4,0,0.2,1)',
                              paddingRight: copiedCode === item.code ? '1.5rem' : '0.35rem',
                              minWidth: '2.5em',
                              marginBottom: '0.1rem',
                            }}
                            title="Click to copy code"
                          >
                            <span style={{ transition: 'opacity 0.2s' }}>{copiedCode === item.code ? 'Copied' : item.code}</span>
                            <span style={{
                              position: 'absolute',
                              right: '0.3rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              opacity: copiedCode === item.code ? 1 : 0,
                              transition: 'opacity 0.3s',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              pointerEvents: 'none',
                            }}>
                              <Checkmark size={16} />
                            </span>
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Valid Till */}
                  {(offer.validTill || offer.valid_till) && (
                    <div style={{ fontSize: '0.9rem', color: ibmColors.darkGray, margin: '0.5rem 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      <span>Valid Till: {offer.validTill || offer.valid_till}</span>
                    </div>
                  )}
                  {/* Offer Details with dotted border */}
                  {offer.offerDetails && (
                    <div style={{ border: '1.5px dotted #0f62fe', borderRadius: 6, padding: '0.7em 1em', margin: '0.7em 0', background: '#f8fbff', color: ibmColors.text, fontSize: '0.97em', wordBreak: 'break-word' }}>
                      <strong>Offer Details:</strong><br />
                      {offer.offerDetails}
                    </div>
                  )}
                </div>
                {/* Savings for One-Time Offers - Moved to bottom */}
                {offer.savings && offer.savings > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginTop: 'auto',
                    padding: '0.4rem',
                    background: 'rgba(36, 161, 72, 0.1)',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500, marginRight: '0.5rem' }}>Rewards:</span>
                    {(() => {
                      const savings = offer.savings || 0;
                      const rewardType = offer.reward_type || 'unknown';
                      
                      if (rewardType === 'points') {
                        return (
                          <>
                            <span style={{ fontSize: '1.2rem', color: '#ffd700' }}>🟡</span>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1rem', fontWeight: 600 }}>+{savings.toLocaleString()} pts</span>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <Money size={18} style={{ fill: '#24a148', marginRight: '0.4rem' }} />
                            <span style={{ color: '#24a148', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: '1rem' }}>+₹{savings.toLocaleString()}</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                )}
                {(offer.avail_offer_link || offer.availOfferLink || offer.avail_url) && (
                  <Button
                    kind="primary"
                    size="sm"
                    style={{ marginTop: '0.75rem', width: '100%' }}
                    onClick={e => {
                      e.stopPropagation();
                      window.open(offer.avail_offer_link || offer.availOfferLink || offer.avail_url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Avail Offer
                  </Button>
                )}
              </div>
            </Tile>
          );
        })}
        </div>
      </div>
      {/* Right Side: Bill-like Summary */}
      <div className={styles.summaryColumn}>
        <div className={styles.summaryFrameOuter}>
          <div className={styles.summaryFrameInner}>
            <div className={styles.summaryTile} style={{ position: 'relative' }}>
              {/* Bill Header */}
              <div className={styles.summaryHeader}>
                <h3 className={styles.summaryTitle}>Unclaimed Rewards</h3>
                <p className={styles.summaryDate}>{currentDate}</p>
                <p className={styles.summarySubtitle}>Personalized Rewards Summary</p>
              </div>
              {/* Total Rewards section just below the Bill Header */}
              <div style={{ marginTop: '-1.3rem', marginBottom: '0.6rem' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  padding: '0.2rem 0',
                }}>
                  {/* Label on the left */}
                  <div style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#fff',
                    minWidth: '110px',
                    textAlign: 'left',
                  }}>
                    Total Rewards
                  </div>
                  {/* Stacked total on the right */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {totalMoneySavings > 0 && (
                      <span style={{ fontWeight: 900, color: '#fff', fontSize: '1.5rem', lineHeight: 1.1 }}>
                        ₹{totalMoneySavings.toLocaleString()}
                      </span>
                    )}
                    {totalPoints > 0 && (
                      <span style={{ fontWeight: 900, color: '#ffd700', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                        🟡 {totalPoints.toLocaleString()}<span style={{ fontSize: '0.75em', marginLeft: 2, verticalAlign: 'super' }}>pts</span>
                      </span>
                    )}
                    {totalMoneySavings === 0 && totalPoints === 0 && (
                      <span style={{ fontWeight: 900, color: '#fff', fontSize: '1.5rem', lineHeight: 1.1 }}>
                        ₹0
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #e0e0e0', width: '100%', margin: '0.15rem 0' }} />
              </div>
              
              {/* Simple Category Summary */}
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                <div style={{ color: '#e0ffe6', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>📋 Rewards Breakdown:</div>
                {discountOffers.length > 0 && (
                  <div style={{ color: '#e0ffe6', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{discountOffers.length} Discount Offers</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                      ₹{discountOffers.reduce((sum, offer) => {
                        const rewardType = offer.reward_type || 'unknown';
                        return sum + (rewardType !== 'points' ? (offer.savings || 0) : 0);
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {cashbackOffers.length > 0 && (
                  <div style={{ color: '#e0ffe6', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{cashbackOffers.length} Cashback Offers</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                      ₹{cashbackOffers.reduce((sum, offer) => sum + (offer.savings || 0), 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {pointsOffers.length > 0 && (
                  <div style={{ color: '#e0ffe6', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{pointsOffers.length} Points Offers</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#ffd700' }}>
                      🟡 {pointsOffers.reduce((sum, offer) => sum + (offer.savings || 0), 0).toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>    
              
              {/* Bill Items - Scrollable */}
              <div className={styles.summaryItemsScroll} ref={summaryItemsScrollRef}>
                <div className={styles.summaryItemsHeader}>
                  <span>Offer</span>
                  <span>Reward</span>
                </div>
                {allOffers.map((offer, index) => {
                  // Create a truly unique key by combining multiple identifiers
                  const offerType = offer.offer_type || 'one-time';
                  const offerId = offer.id || offer.Id || `no-id-${index}`;
                  const uniqueKey = `${offerType}-${offerId}-${index}`;
                  // Remove bottom border for last row
                  const isLast = index === allOffers.length - 1;
                  return (
                    <div
                      key={uniqueKey}
                      className={styles.summaryItemRow}
                      style={isLast ? { borderBottom: 'none' } : {}}
                    >
                    <div className={styles.summaryItemTitleBrand}>
                      <p className={styles.summaryItemTitle}>
                        {offer.title.length > 25 ? offer.title.substring(0, 25) + '...' : offer.title}
                      </p>
                      <p className={styles.summaryItemBrand}>
                        {offer.brand}
                      </p>
                    </div>
                    <div className={styles.summaryItemSavingsCol}>
                      <p className={styles.summaryItemSavings}>
                        {(() => {
                          const savings = offer.savings || 0;
                          const rewardType = offer.reward_type || 'unknown';
                          const rewardText = offer.reward_text || '';
                          
                          switch (rewardType) {
                            case 'points':
                              // Reduce the space between number and pts slightly (from '  ' to ' ') using a thin space (U+2009)
                              return `🟡\u2009${savings.toLocaleString()}\u2009pts`;
                            case 'cashback':
                              return `₹${savings.toLocaleString()}`;
                            case 'discount_fixed':
                              return `₹${savings.toLocaleString()}`;
                            case 'discount_percent':
                              return `${savings}% off`;
                            default:
                              return `₹${savings.toLocaleString()}`;
                          }
                        })()}
                      </p>
                      {offer.progress && offer.progress < 100 && (
                        <p className={styles.summaryItemProgress}>{offer.progress}% progress</p>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
                {/* Down Arrow Button above the total section */}
                {showScrollDown && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      aria-label="Scroll to bottom"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onClick={() => {
                        if (summaryItemsScrollRef.current) {
                          summaryItemsScrollRef.current.scrollTo({
                            top: summaryItemsScrollRef.current.scrollHeight,
                            behavior: 'smooth',
                          });
                        }
                      }}
                      onMouseOver={e => (e.currentTarget.firstChild as HTMLElement).style.transform = 'scale(1.2)'}
                      onMouseOut={e => (e.currentTarget.firstChild as HTMLElement).style.transform = 'scale(1)'}
                    >
                      <ChevronDown size={28} color="#fff" style={{ transition: 'transform 0.15s' }} />
                    </button>
                  </div>
                )}
              {/* More Details Modal for One-Time Offers */}
              {activeModalOffer && (
                <Modal
                  open={!!activeModalOffer}
                  onRequestClose={() => setActiveModalOffer(null)}
                  modalHeading={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {activeModalOffer.title}
                      {(activeModalOffer.validTill || activeModalOffer.valid_till) && (
                        <span style={{
                          background: '#e8f0fe',
                          color: '#0f62fe',
                          borderRadius: 12,
                          padding: '2px 12px',
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          marginLeft: 8,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <Calendar size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          Valid Till: {activeModalOffer.validTill || activeModalOffer.valid_till}
                        </span>
                      )}
                    </span>
                  }
                  primaryButtonText="Close"
                  onRequestSubmit={() => setActiveModalOffer(null)}
                  size="sm"
                >
                  {(activeModalOffer.termsAndConditions || activeModalOffer.terms_and_conditions) && (() => {
                    const raw = activeModalOffer.termsAndConditions || activeModalOffer.terms_and_conditions || '';
                    // Remove leading single quote and trim
                    const cleaned = raw.replace(/^'+/, '').trim();
                    // Split into bullet points on newlines or dashes
                    const points = cleaned.split(/\n|\r|(?<!-)\-(?!-)/).map(s => s.trim()).filter(Boolean);
                    return (
                      <div style={{ marginBottom: '1rem' }}>
                        <h5 style={{ margin: 0, marginBottom: 4 }}>Terms and Conditions</h5>
                        <ul style={{ fontSize: '0.95rem', color: ibmColors.darkGray, paddingLeft: 0, listStyleType: 'none', margin: 0 }}>
                          {points.map((pt, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                              <span style={{ color: '#0f62fe', fontWeight: 'bold', marginRight: 8, fontSize: '1.1em', lineHeight: 1.2 }}>•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  {(activeModalOffer.howToRedeem || activeModalOffer.how_to_redeem) && (() => {
                    const raw = activeModalOffer.howToRedeem || activeModalOffer.how_to_redeem || '';
                    const cleaned = raw.replace(/^'+/, '').trim();
                    const points = cleaned.split(/\n|\r|(?<!-)\-(?!-)/).map(s => s.trim()).filter(Boolean);
                    return (
                      <div>
                        <h5 style={{ margin: 0, marginBottom: 4 }}>How to Redeem</h5>
                        <ul style={{ fontSize: '0.95rem', color: ibmColors.darkGray, paddingLeft: 0, listStyleType: 'none', margin: 0 }}>
                          {points.map((pt, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                              <span style={{ color: '#0f62fe', fontWeight: 'bold', marginRight: 8, fontSize: '1.1em', lineHeight: 1.2 }}>•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  {!(activeModalOffer.termsAndConditions || activeModalOffer.terms_and_conditions || activeModalOffer.howToRedeem || activeModalOffer.how_to_redeem) && (
                    <div style={{ color: ibmColors.darkGray }}>No additional details available.</div>
                  )}
                </Modal>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPersonalization;