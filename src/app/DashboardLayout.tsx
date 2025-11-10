'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalBody, Button, Layer } from '@carbon/react';
import { Logout, User, Report, Purchase, Gift, Close, Download } from '@carbon/icons-react';
import CustomerProfile from '@/components/CustomerProfile';
import CibilAnalysis from '@/components/CibilAnalysis';
import OfferPersonalization from '@/components/OfferPersonalization';
import React from 'react';

type ViewType = 'customer' | 'cibil' | 'offers' | 'cards';

const BACKEND_URL = 'http://localhost:8000';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewType>('customer');
  const [responses, setResponses] = useState<Record<ViewType, any>>({
    customer: null,
    cibil: null,
    offers: null,
    cards: null
  });
  const [loading, setLoading] = useState<Record<ViewType, boolean>>({
    customer: false,
    cibil: false,
    offers: false,
    cards: false
  });
  const [customerName, setCustomerName] = useState<string>('');
  const [customerProfileData, setCustomerProfileData] = useState<any>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [recommendedCard, setRecommendedCard] = useState<any>(null);
  const [cardList, setCardList] = useState<any[]>([]);
  const [modalSelectedCard, setModalSelectedCard] = useState<any>(null);
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [isPersonalPopoverOpen, setIsPersonalPopoverOpen] = useState(false);
  const nameRef = React.useRef<HTMLParagraphElement>(null);
  const [cardDetailsLoading, setCardDetailsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    // Check if we have preloaded data
    const preloadedData = sessionStorage.getItem('preloadedData');
    const storedCustomerName = sessionStorage.getItem('customerName');
    const storedCardData = sessionStorage.getItem('recommendedCard');
    
    if (!preloadedData || !storedCustomerName) {
      // No preloaded data, redirect to login
      router.push('/login');
      return;
    }
    
    try {
      const parsedData = JSON.parse(preloadedData);
      setResponses(parsedData);
      setCustomerName(storedCustomerName);
      
      // Load recommended card if exists
      if (storedCardData) {
        setRecommendedCard(JSON.parse(storedCardData));
      } else {
        // If no stored card, create a default one
        const defaultCard = {
          name: 'BOB Premier Card',
          type: 'Premium',
          cardNumber: '4532 **** **** 8765',
          features: ['Unlimited lounge access', '5X reward points on travel', 'Complimentary insurance'],
          benefits: ['Annual fee waiver on spending ₹5L+', 'Welcome bonus 10,000 points'],
          reasoning: 'Perfect for high-spending customers with travel preferences and premium lifestyle needs.',
          category: 'Travel & Lifestyle',
          annualFee: '₹5,000',
          joiningFee: '₹2,500',
          color: '#0f62fe'
        };
        setRecommendedCard(defaultCard);
        sessionStorage.setItem('recommendedCard', JSON.stringify(defaultCard));
      }
      
      // Extract customer profile data
      if (parsedData.customer) {
        setCustomerProfileData(parsedData.customer);
      }
      
      console.log('✅ Dashboard loaded with preloaded data for:', storedCustomerName);
      console.log('📊 Preloaded data structure:', parsedData);
      console.log('📊 Offers data:', parsedData.offers);
      
      // Set loading states to false since data is preloaded
      setLoading({
        customer: false,
        cibil: false,
        offers: false,
        cards: false
      });
    } catch (error) {
      console.error('❌ Error parsing preloaded data:', error);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Only run if we have real recommendations and haven't loaded them yet
    if (
      responses.cards?.result?.recommended_cards &&
      responses.cards.result.recommended_cards.length > 0 &&
      cardList.length === 0
    ) {
      handleCardRecommendation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses.cards]);

  // Offers are already preloaded during login, no need to fetch again

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    console.log(`🔄 Switching to ${view} view`);
  };

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('preloadedData');
    sessionStorage.removeItem('customerName');
    sessionStorage.removeItem('aadhaar');
    sessionStorage.removeItem('recommendedCard');
    
    // Redirect to login
    router.push('/login');
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('📄 Starting PDF download...');
      
      // Show loading state
      setDownloadLoading(true);

      // Prepare the data for PDF generation
      const pdfData = {
        profile: responses.customer,
        cibil_analysis: responses.cibil,
        card_recommendation: responses.cards,
        offer_personalization: responses.offers
      };

      console.log('📄 PDF Data being sent:', JSON.stringify(pdfData, null, 2));

      // Call the PDF generation endpoint
      const response = await fetch('http://localhost:8000/generate-pdf/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${customerName}_Credit_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      // Reset loading state
      setDownloadLoading(false);
    }
  };

  const fetchCardDetails = async (cardName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/card-details?card_name=${encodeURIComponent(cardName)}`);
      if (!response.ok) throw new Error('Failed to fetch card details');
      const data = await response.json();
      return data;
    } catch (e) {
      return { error: String(e) };
    }
  };

  const handleCardRecommendation = async () => {
    // Use real API data if available, otherwise fall back to mock
    let cards: any[] = [];
    if (responses.cards?.result?.recommended_cards && responses.cards.result.recommended_cards.length > 0) {
      setCardDetailsLoading(true);
      // Fetch DB details for each recommended card
      const agentCards = responses.cards.result.recommended_cards;
      const dbCards = await Promise.all(
        agentCards.map(async (card: any) => {
          const dbData = await fetchCardDetails(card.Card_Name);
          return {
            name: card.Card_Name || '',
            type: card.Type || '',
            features: dbData.Key_features_and_benefits
              ? String(dbData.Key_features_and_benefits).split(/,(?!\d{3})/).map((f: string) => f.trim())
              : [],
            benefits: dbData.benefits ? (Array.isArray(dbData.benefits) ? dbData.benefits : String(dbData.benefits).split(' - ').map((b: string) => b.trim())) : [],
            reasoning: card.justification || '',
            category: dbData.Type || card.Type || '',
            annualFee: dbData.annual_fee !== undefined && dbData.annual_fee !== null && dbData.annual_fee !== '' ? `₹${dbData.annual_fee}` : '',
            color: '#0f62fe',
            image_url: dbData.image_url || '',
            score: 0
          };
        })
      );
      cards = dbCards;
      setCardDetailsLoading(false);
    } else {
      // Fallback to mock card data
      cards = [
        {
          name: 'BOB Premier Card',
          type: 'Premium',
          cardNumber: '4532 **** **** 8765',
          features: ['Unlimited lounge access', '5X reward points on travel', 'Complimentary insurance'],
          benefits: ['Annual fee waiver on spending ₹5L+', 'Welcome bonus 10,000 points'],
          reasoning: 'Perfect for high-spending customers with travel preferences and premium lifestyle needs.',
          category: 'Travel & Lifestyle',
          annualFee: '₹5,000',
          color: '#0f62fe',
          image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2Frmmjc55a%2Fpremier-shadow-19-feb24.png&w=1080&q=75',
          score: 9.2
        }
      ];
    }
    setCardList(cards);
    // Do NOT open the modal or set selected card here
  };

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false);
  };

  // Popover close on outside click
  React.useEffect(() => {
    if (!isPersonalPopoverOpen) return;
    function handleClick(event: MouseEvent) {
      if (
        nameRef.current &&
        !nameRef.current.contains(event.target as Node) &&
        !(document.getElementById('personal-popover')?.contains(event.target as Node))
      ) {
        setIsPersonalPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isPersonalPopoverOpen]);

  const renderContent = () => {
    switch (activeView) {
      case 'customer':
        return <CustomerProfile response={responses.customer} loading={loading.customer} />;
      case 'cibil':
        return <CibilAnalysis response={responses.cibil} loading={loading.cibil} />;
      case 'offers': {
        const offersData = responses.offers || {};
        // Handle the backend response structure: { result: { onetime_offers: [], progressive_offers: [] } }
        const result = offersData.result || {};
        console.log('🎯 Offers data structure:', offersData);
        console.log('🎯 Offers result:', result);
        console.log('🎯 One-time offers:', result.onetime_offers?.length || 0);
        console.log('🎯 Progressive offers:', result.progressive_offers?.length || 0);
        return <OfferPersonalization 
          loading={loading.offers} 
          onetimeOffers={result.onetime_offers || []} 
          progressiveOffers={result.progressive_offers || []} 
        />;
      }
      case 'cards':
        // Cards are now handled via modal only, redirect to customer profile
        return <CustomerProfile response={responses.customer} loading={loading.customer} />;
      default:
        return <CustomerProfile response={responses.customer} loading={loading.customer} />;
    }
  };

  // Show loading if we don't have customer name yet (still checking session storage)
  if (!customerName) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #161616',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p style={{ color: '#525252', fontSize: '1rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Debug log for what is being passed to CustomerProfile
  console.log("CustomerProfile response prop:", customerProfileData);

  // Utility to mask card number except last 4 digits
  function maskCardNumber(cardNumber: string) {
    // Remove spaces and dashes, then mask all but last 4
    const clean = cardNumber.replace(/[^\d]/g, '');
    if (clean.length < 4) return cardNumber;
    return '**** **** **** ' + clean.slice(-4);
  }

  // Card types DB enrichment (static, but in real app, fetch from backend or cache)
  const cardTypesDb: Record<string, { image_url: string; annual_fee: number; benefits: string }> = {
    'Eterna': { image_url: 'https://cms-resources.groww.in/uploads/Bo_B_Eterna_credit_card_958e17747d.png', annual_fee: 2499, benefits: 'Unlimited domestic lounge access - ₹1 crore air accident insurance - 2% forex markup - cashback redemption - milestone fee waiver' },
    'Premier': { image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2Frmmjc55a%2Fpremier-shadow-19-feb24.png&w=1080&q=75', annual_fee: 1000, benefits: '1 complimentary lounge access/quarter - insurance cover - fuel surcharge waiver - add-on cards - travel perks' },
    'IRCTC BoB': { image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2F142p4wp2%2Firctc_final.png&w=1080&q=75', annual_fee: 350, benefits: 'Cashback on IRCTC spends - EMI conversion - shopping rewards - travel insurance - add-on cards' },
    'HPCL BoB ENERGIE': { image_url: 'https://cd9941cc.delivery.rocketcdn.me/wp-content/uploads/2022/06/HPCL-ENERGIE-BOBCARD-Credit-Card.webp', annual_fee: 499, benefits: '25% off movie tickets - fuel surcharge waiver - shopping vouchers - accelerated fuel rewards - cashback redemption' },
    'Snapdeal': { image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2Fjyvpjc5l%2Fsnapdeal_front.png&w=1920&q=75', annual_fee: 249, benefits: 'Online shopping perks - cashback redemption - unlimited rewards - add-on cards - exclusive Snapdeal offers' },
    'SELECT': { image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2Fkjwj40ea%2Fselect-card.png&w=1920&q=75', annual_fee: 750, benefits: '3 add-on cards - insurance (₹15L air/₹5L non-air) - fuel surcharge waiver - cashback redemption - online shopping offers' },
    'Empower': { image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2Fwnvhzmi1%2Fempower-card.png&w=1080&q=75', annual_fee: 0, benefits: '' },
    // ... add more as needed ...
  };

  // Helper to normalize card names for lookup
  function normalizeCardName(name: string) {
    return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Build a normalized lookup map
  const normalizedCardTypesDb: Record<string, { image_url: string; annual_fee: number; benefits: string }> = Object.fromEntries(
    Object.entries(cardTypesDb).map(([k, v]) => [normalizeCardName(k), v])
  );

  // Credit Card Component
  const CreditCardDisplay: React.FC<{ card: any }> = ({ card }) => {
    if (!card) return null;
    const maskedNumber = card.cardNumber ? maskCardNumber(card.cardNumber) : '**** **** **** 0000';
    return (
      <div
        style={{
        padding: '1.25rem', 
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        position: 'relative',
        margin: '0.5rem 0',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(15,98,254,0.07)',
          cursor: 'pointer', // Add pointer cursor for clickability
          transition: 'box-shadow 0.2s',
        }}
        onClick={() => {
          setModalSelectedCard(card);
          setIsCardModalOpen(true);
        }}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setModalSelectedCard(card);
            setIsCardModalOpen(true);
          }
        }}
        aria-label={`View details for ${card.name}`}
      >
                <div style={{
          fontSize: '0.75rem',
          color: '#24a148',
          marginBottom: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textShadow: '0 0 10px rgba(36, 161, 72, 0.6), 0 0 20px rgba(36, 161, 72, 0.4), 0 0 30px rgba(36, 161, 72, 0.2)',
          borderBottom: '2px dotted #24a148',
          paddingBottom: '0.25rem'
        }}>
          A BETTER CARD FOR YOU
        </div>
        {/* Card Image with Shiny Effect */}
        <div style={{
          width: '100%',
          height: '140px',
          position: 'relative',
          marginBottom: '0.75rem',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
            animation: 'shine 15s ease-in-out infinite',
            zIndex: 2,
            pointerEvents: 'none'
          }} />
          
          <img
            src={card.image_url && card.image_url.trim() !== '' ? card.image_url : '/bob.png'}
            alt={card.name + ' card image'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '12px',
              position: 'relative',
              zIndex: 1
            }}
            onError={(e) => { 
              console.log('Sidebar image failed to load for:', card.name);
              e.currentTarget.src = '/bob.png'; 
            }}
          />
        </div>
        {/* Card Info */}
        <div style={{ fontSize: '0.75rem', color: '#525252', marginBottom: '0.5rem' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: '500' }}>Category:</span> {card.category}
          </div>
        </div>
        <Button 
          size="sm" 
          kind="primary" 
          style={{ width: '100%', marginTop: 8 }}
          onClick={e => {
            e.stopPropagation(); // Prevent parent click
            setModalSelectedCard(card);
            setIsCardModalOpen(true);
          }}
        >
          View Details
        </Button>
      </div>
    );
  };

  // Also update sidebarTopCard logic to use only DB data
  let sidebarTopCard = null;
  if (cardList && cardList.length > 0) {
    sidebarTopCard = cardList[0];
  } else {
    sidebarTopCard = {
      name: 'BOB Premier Card',
      type: 'Premium',
      cardNumber: '4532 **** **** 8765',
      features: ['Unlimited lounge access', '5X reward points on travel', 'Complimentary insurance'],
      benefits: ['Annual fee waiver on spending ₹5L+', 'Welcome bonus 10,000 points'],
      reasoning: 'Perfect for high-spending customers with travel preferences and premium lifestyle needs.',
      category: 'Travel & Lifestyle',
      annualFee: '₹5,000',
      color: '#0f62fe',
      image_url: 'https://www.bobcard.co.in/_next/image?url=https%3A%2F%2Fmedia.bobcard.co.in%2F%2Fmedia%2Frmmjc55a%2Fpremier-shadow-19-feb24.png&w=1080&q=75',
      score: 9.2
    };
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar - Fixed height with scroll */}
      <div style={{ 
        width: '280px', 
        backgroundColor: '#ffffff', 
        padding: '1.5rem 0', 
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'sticky',
        top: 0
      }}>
        {/* Logo */}
        <div style={{ 
          padding: '0 1.5rem', 
          marginBottom: '2rem', 
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '1rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '700',
                  color: '#161616'
                }}>
                  FinSage
                </span>
              </div>
              {/* Powered by watsonx */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 4, marginLeft: 2 }}>
                <span style={{ fontSize: '0.85rem', color: '#8d8d8d', fontWeight: 500 }}>Powered by</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#161616', letterSpacing: '0.01em', marginLeft: 0 }}>
                  <span style={{ color: '#161616', fontWeight: 700 }}>IBM </span>
                  watson
                  <span style={{ color: '#0f62fe' }}>x</span>
                  <span style={{ color: '#161616' }}>.ai</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1rem', padding: '0 1rem' }}>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#8d8d8d', 
              margin: '0 0 0.5rem 0.5rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              NAVIGATION
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <button
              onClick={() => handleViewChange('customer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: activeView === 'customer' ? '#f4f4f4' : '#ffffff',
                color: '#161616',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'left',
                marginLeft: '0',
                marginRight: '0'
              }}
            >
              <User size={20} />
              <span>Customer Profile</span>
            </button>
            
            <button
              onClick={() => handleViewChange('offers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: activeView === 'offers' ? '#f4f4f4' : '#ffffff',
                color: '#161616',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'left',
                marginLeft: '0',
                marginRight: '0'
              }}
            >
              <Gift size={20} />
              <span>Offers & Benefits</span>
            </button>
            
            <button
              onClick={() => handleViewChange('cibil')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: activeView === 'cibil' ? '#f4f4f4' : '#ffffff',
                color: '#161616',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'left',
                marginLeft: '0',
                marginRight: '0'
              }}
            >
              <Report size={20} />
              <span>CIBIL Analysis</span>
            </button>
            {/* Download Report as a nav tab */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                color: '#0f62fe',
                border: '2px solid #0f62fe',
                borderRadius: 0,
                cursor: downloadLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                width: '100%',
                textAlign: 'left',
                marginLeft: 0,
                marginRight: 0,
                marginBottom: 0,
                outline: 'none',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                boxShadow: '0 0 0 0 rgba(15,98,254,0)',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e8f0fe';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f62fe';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f62fe';
              }}
              tabIndex={0}
              aria-label="Download Report"
            >
              <Download size={20} style={{ color: '#0f62fe' }} />
              <span>{downloadLoading ? 'Downloading...' : 'Download Report'}</span>
            </button>
          </div>
        </div>

        {/* Recommended Card Display */}
        {sidebarTopCard && (
          <div style={{ flexShrink: 0 }}>
            <CreditCardDisplay card={sidebarTopCard} />
          </div>
        )}

        {/* User Section */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e0e0e0', 
          marginTop: 'auto',
          flexShrink: 0,
          position: 'relative'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            position: 'relative'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: '#161616', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <User size={18} style={{ color: '#ffffff' }} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <p
                ref={nameRef}
                style={{ 
                  margin: '0', 
                  fontSize: '0.875rem', 
                  color: '#161616',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textUnderlineOffset: '2px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  padding: 0
                }}
                onClick={() => setIsPersonalPopoverOpen((v) => !v)}
                title="View personal information"
                tabIndex={0}
              >
                {customerName.toUpperCase()}
              </p>
              {/* Popover for personal info */}
              {isPersonalPopoverOpen && customerProfileData?.customer && (
                <Layer>
                  <div
                    id="personal-popover"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: 'calc(100% + 16px)',
                      transform: 'translateX(-50%)',
                      zIndex: 100,
                      minWidth: '240px',
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      borderRadius: 4,
                      padding: '1rem 1.5rem 1rem 1rem',
                      marginBottom: 4,
                      fontSize: '0.92rem',
                      color: '#161616',
                      animation: 'fadeIn 0.18s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <button
                      onClick={() => setIsPersonalPopoverOpen(false)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                        color: '#8d8d8d',
                        zIndex: 2
                      }}
                      aria-label="Close personal info"
                    >
                      <Close size={20} />
                    </button>
                    {/* Compact customer summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                      {/* Profile icon above the name */}
                      <div style={{
                        width: 160,
                        height: 160,
                        background: '#0f62fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        marginBottom: 4
                      }}>
                        <User size={72} style={{ color: '#fff' }} />
                      </div>
                      {/* Name and details (align left) */}
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 2, textAlign: 'left', width: '100%' }}>{customerProfileData.customer.name}</div>
                      <div style={{ color: '#8d8d8d', fontSize: '0.92rem', textAlign: 'left', width: '100%' }}>{customerProfileData.customer.state}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.92rem', justifyContent: 'flex-start', width: '100%' }}>
                        <span>Member Since:</span>
                        <span style={{ color: '#161616', fontWeight: 500 }}>{customerProfileData.customer.member_since}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.92rem', justifyContent: 'flex-start', width: '100%' }}>
                        <span>Card Type:</span>
                        <span style={{ color: '#0f62fe', fontWeight: 500 }}>{customerProfileData.customer.card_type}</span>
                      </div>
                      {/* Account Status as a tag/badge */}
                      {customerProfileData.customer.status && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.92rem', justifyContent: 'flex-start', width: '100%', marginTop: 4 }}>
                          <span>Account Status:</span>
                          <span style={{ color: '#198038', fontWeight: 500 }}>{customerProfileData.customer.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Layer>
              )}
            </div>
            <button
              onClick={() => {
                setIsPersonalPopoverOpen(false);
                handleLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#161616',
                border: '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Logout size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#f4f4f4',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100vh'
      }}>
        {renderContent()}
      </div>

      {/* Card Recommendation Modal */}
      <Modal 
        open={isCardModalOpen} 
        onRequestClose={handleCloseCardModal}
        modalHeading="Card Recommendation"
        primaryButtonText="Apply Now"
        secondaryButtonText="Close"
        size="lg"
        onRequestSubmit={() => {
          window.open('https://cardonline.bobcard.co.in/', '_blank', 'noopener,noreferrer');
        }}
      >
        <ModalBody style={{ outline: 'none' }}>
          <div style={{ outline: 'none' }}>
          {modalSelectedCard && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div>
                {/* Card Image */}
                <div style={{
                  width: '100%',
                  height: '220px',
                  position: 'relative',
                  marginBottom: '1.5rem',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <img
                    src={modalSelectedCard.image_url && modalSelectedCard.image_url.trim() !== '' ? modalSelectedCard.image_url : '/bob.png'}
                    alt={modalSelectedCard.name + ' card image'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                    onError={(e) => { 
                      console.log('Modal image failed to load for:', modalSelectedCard.name);
                      e.currentTarget.src = '/bob.png'; 
                    }}
                  />
                </div>
                {/* Label for Thumbnails */}
                {cardList && cardList.length > 1 && (
                  <>
                    <div style={{
                      fontWeight: 600,
                      color: '#525252',
                      fontSize: '0.95rem',
                      marginBottom: 6,
                      marginLeft: 2
                    }}>
                      Other Options
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 12,
                      marginBottom: 16,
                    }}>
                      {cardList.map((card, idx) => (
                        <div key={idx} style={{
                          width: 72,
                          minWidth: 72,
                          height: 48,
                          background: '#f4f4f4',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          border: card === modalSelectedCard ? '2px solid #0f62fe' : '1px solid #e0e0e0',
                          cursor: 'pointer',
                        }}
                        onClick={() => setModalSelectedCard(card)}
                        >
                          <img
                            src={card.image_url && card.image_url.trim() !== '' ? card.image_url : '/bob.png'}
                            alt={card.name}
                            style={{
                              width: 56,
                              height: 36,
                              objectFit: 'cover',
                              borderRadius: 6,
                              background: '#fff',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{ padding: '0 1rem' }}>
                <h2 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1.5rem', 
                  fontWeight: '600',
                  color: '#161616' 
                }}>{modalSelectedCard.name}</h2>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#525252', 
                  marginBottom: '1.5rem', 
                  lineHeight: '1.5' 
                }}>
                  {modalSelectedCard.reasoning}
                </div>
                {/* Key Features & Benefits Combined Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    margin: '0 0 0.75rem 0',
                    color: '#161616'
                  }}>Key Features & Benefits</h3>
                  <ul style={{ 
                    margin: '0', 
                    padding: '0 0 0 1.5rem', 
                    color: '#525252', 
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    listStyle: 'none'
                  }}>
                    {(modalSelectedCard && modalSelectedCard.features && Array.isArray(modalSelectedCard.features)
                      ? modalSelectedCard.features
                      : typeof modalSelectedCard.features === 'string' && modalSelectedCard.features.trim() !== ''
                        ? modalSelectedCard.features.split(',')
                        : []
                    ).map((item: string, i: number) => (
                      <li key={i} style={{ 
                        marginBottom: '0.75rem',
                        position: 'relative',
                        paddingLeft: '1.5rem'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: '0',
                          top: '0.5rem',
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#0f62fe',
                          borderRadius: '50%'
                        }} />
                        {item.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Card Details */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr', 
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: '#525252'
                }}>
                  <div style={{
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#f4f4f4'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#525252',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      Category
                    </div>
                    <div style={{ fontWeight: '600', color: '#161616' }}>
                      {modalSelectedCard.category}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
} 