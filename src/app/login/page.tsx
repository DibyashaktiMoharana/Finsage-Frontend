'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Header,
  HeaderName,
  Form,
  TextInput,
  Button,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import { ArrowRight, Security } from '@carbon/icons-react';

function LoginPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState({
    customer: false,
    cibil: false,
    cards: false,
    offers: false,
  });
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!customerName.trim()) return;

    setIsLoading(true);
    setError('');
    setPreloadProgress({
      customer: false,
      cibil: false,
      cards: false,
      offers: false,
    });

    const endpoints = {
      customer: '/analyze-customer',
      cibil: '/cibil-analysis',
      cards: '/card-recommendation',
      offers: '/offer-personalization',
    };

    console.log('🚀 Starting comprehensive data preload for:', customerName);
    const startTime = Date.now();
    
    try {
      const apiCalls = Object.entries(endpoints).map(async ([viewType, endpoint]) => {
        try {
          const payload = {
            customer_name: customerName,
            aadhaar: aadhaar,
          };
          console.log(`📡 Calling ${endpoint} for ${viewType} with payload:`, payload);
          const response = await fetch(`http://localhost:8000${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`✅ ${viewType} data loaded:`, data);

          setPreloadProgress((prev) => ({ ...prev, [viewType]: true }));

          return { viewType, data };
        } catch (error) {
          console.error(`❌ Error loading ${viewType}:`, error);
          setPreloadProgress((prev) => ({ ...prev, [viewType]: true }));
          return { viewType, data: { error: String(error) } };
        }
      });

      const results = await Promise.all(apiCalls);

      const preloadedData = {
        customer: null,
        cibil: null,
        cards: null,
        offers: null,
      };

      results.forEach(({ viewType, data }) => {
        preloadedData[viewType] = data;
      });

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`🎉 All data preloaded in ${totalTime.toFixed(2)}s`);
      console.log('🗃️ Final preloadedData:', preloadedData);

      const customerData = preloadedData.customer;
      if (customerData?.result?.error === 'Customer not found') {
        setError('Customer not found. Please check the name and try again.');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('preloadedData', JSON.stringify(preloadedData));
      sessionStorage.setItem('customerName', customerName);
      sessionStorage.setItem('aadhaar', aadhaar);

      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Error during data preload:', error);
      setError('An error occurred while loading customer data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header aria-label="FinSage">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0,
            marginLeft: '1.5rem', // Increased left margin for logo
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#161616' }}>FinSage</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: 2,
              marginLeft: 2,
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#8d8d8d', fontWeight: 500 }}>Powered by</span>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#161616',
                letterSpacing: '0.01em',
                marginLeft: 0,
              }}
            >
              <span style={{ color: '#161616', fontWeight: 700 }}>IBM </span>
              watson
              <span style={{ color: '#0f62fe' }}>x</span>
              <span style={{ color: '#161616' }}>.ai</span>
            </span>
          </div>
        </div>
      </Header>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left side - Form */}
        <div style={{ 
          width: '40%', 
          padding: '4rem 3rem', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#f4f4f4'
        }}>
          <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            {/* Icon above title, left-aligned */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Security size={40} style={{ color: '#176cff' }} />
            </div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '300', 
              marginBottom: '0.5rem',
              color: '#161616',
              textAlign: 'left'
            }}>
              Log in to FinSage
            </h1>
            <p style={{ 
              marginBottom: '3rem', 
              color: '#525252',
              fontSize: '0.875rem',
              textAlign: 'left'
            }}>
              Enter customer details for financial analysis
            </p>
            
            <Form>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <TextInput
                    id="customer-name"
                    labelText="Customer Name"
                    placeholder="Enter customer name (e.g., YASH GAURKAR)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isLoading}
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>

                <div>
                  <TextInput
                    id="aadhaar"
                    labelText="Aadhaar Number"
                    placeholder="Enter Aadhaar number for enhanced analysis"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    disabled={isLoading}
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
              
              {error && (
                <InlineNotification
                  kind="error"
                  title="Error"
                  subtitle={error}
                  style={{ marginBottom: '1.5rem' }}
                />
              )}

              <Button
                kind="primary"
                onClick={handleLogin}
                disabled={!customerName.trim() || isLoading}
                style={{ 
                  marginBottom: '1.5rem', 
                  width: '100%',
                  height: '48px',
                  fontSize: '1rem',
                  backgroundColor: '#176cff',
                  borderColor: '#176cff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: '2rem',
                  paddingRight: '2rem',
                  color: '#fff',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  boxShadow: 'none',
                  textAlign: 'left',
                  gap: '0.5rem',
                }}
              >
                {isLoading ? (
                  <span style={{ width: '100%' }}>Analyzing Customer...</span>
                ) : (
                  <>
                    <span style={{ textAlign: 'left', fontSize: '1rem' }}>Continue</span>
                    <ArrowRight size={20} style={{ color: '#fff', fontSize: '1rem' }} />
                  </>
                )}
              </Button>
              
              {isLoading && (
                <InlineLoading
                  description="Loading Customer Insights..."
                />
              )}
            </Form>
          </div>
        </div>

        {/* Right side - Image */}
        <div style={{ 
          width: '60%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          padding: '2rem'
        }}>
          <img
            src="/image.png"
            alt="FinSage Analytics Platform"
            style={{ 
              width: '80%', 
              height: 'auto', 
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;