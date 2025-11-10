'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tile, 
  Grid, 
  Column, 
  Loading,
  Tag,
  ProgressBar,
  Button,
  InlineNotification,
  SkeletonText
} from '@carbon/react';
import { User, Purchase, Analytics, Report, Money, Currency, Wallet, ChevronDown } from '@carbon/icons-react';
import styles from './styles/CustomerProfile.module.css';
import clsx from 'clsx';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { endOfMonth, isSameMonth, subMonths } from 'date-fns';

// Using a simplified chart approach with Carbon colors but fallback to simple visualization
// This avoids TypeScript complexity while maintaining IBM design standards

interface CustomerProfileProps {
  response: any;
  loading: boolean;
}

// IBM Carbon Colors
const ibmColors = {
  blue: '#0f62fe',
  purple: '#8a3ffc', 
  green: '#198038',
  red: '#fa4d56',
  yellow: '#f1c21b',
  darkBlue: '#002d9c',
  magenta: '#ee538b',
  teal: '#009d9a',
  cyan: '#1192e8',
  orange: '#ff832b'
};
const donutPalette = [
  ibmColors.blue,
  ibmColors.green,
  ibmColors.purple,
  ibmColors.red,
  ibmColors.yellow,
  ibmColors.teal,
  ibmColors.cyan,
  ibmColors.orange,
  ibmColors.magenta,
  ibmColors.darkBlue
];

// Component for rendering markdown content
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => (
  <div className={styles.markdownContent}>
    {content}
  </div>
);

// --- Split DemographicsSection into PersonalDetailsSection and CardDetailsSection ---

// Personal Details Section (for sidebar)
export const PersonalDetailsSection: React.FC<{ customer: any }> = ({ customer }) => {
  if (!customer) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#8d8d8d' }}>
        <p>No personal data available</p>
      </div>
    );
  }
  return (
    <div className={styles.demographicsSection}>
      {/* Removed <h4>Personal Information</h4> to avoid duplicate modal heading */}
      <div className={styles.demographicsSection}>
        {customer.name && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Customer Name</span>
            <span className={styles.fieldValue}>{customer.name}</span>
          </div>
        )}
        {customer.state && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>State</span>
            <span className={styles.fieldValueRegular}>{customer.state}</span>
          </div>
        )}
        {customer.member_since && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Member Since</span>
            <span className={styles.fieldValueRegular}>{customer.member_since}</span>
          </div>
        )}
        {customer.status && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Status</span>
            <Tag type="green" size="sm">{customer.status}</Tag>
          </div>
        )}
      </div>
    </div>
  );
};

// Card Details Section (for CustomerProfile)
const CardDetailsSection: React.FC<{ customer: any }> = ({ customer }) => {
  if (!customer) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#8d8d8d' }}>
        <p>No card data available</p>
      </div>
    );
  }
  return (
    <div className={styles.demographicsSection}>
      {/* Removed <h4>Card Details</h4> to avoid duplicate heading */}
      <div className={styles.demographicsSection}>
        {customer.card_type && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Card Type</span>
            <span className={styles.fieldValue}>{customer.card_type}</span>
          </div>
        )}
        {customer.credit_limit && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Credit Limit</span>
            <span className={styles.fieldValueRegular}>₹{customer.credit_limit.toLocaleString()}</span>
          </div>
        )}
        {customer.available_limit && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Available Limit</span>
            <span className={styles.fieldValueRegular}>₹{customer.available_limit.toLocaleString()}</span>
          </div>
        )}
        {customer.current_balance !== undefined && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Current Balance</span>
            <span className={styles.fieldValueRegular}>₹{customer.current_balance.toLocaleString()}</span>
          </div>
        )}
        {customer.reward_points !== undefined && (
          <div className={styles.fieldContainer}>
            <span className={styles.fieldLabel}>Reward Points</span>
            <span className={styles.fieldValue}>{customer.reward_points}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom IBM-styled Donut Chart Component
const IBMDonutChart: React.FC<{ data: any[] }> = ({ data }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient || !data || data.length === 0) {
    return (
      <div className={styles.skeletonDonutChart}>
        <div className={styles.skeletonDonutChartSvg}>
          <SkeletonText />
        </div>
        <div className={styles.skeletonDonutChartLegend}>
          <SkeletonText />
        </div>
      </div>
    );
  }
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  
  return (
    <div className={styles.donutChartContainer}>
      {/* SVG Donut Chart */}
      <div className={styles.donutChartSvg}>
        <svg width="250" height="250" viewBox="0 0 250 250">
          <g transform="translate(125,125)">
            {data.map((item, index) => {
              const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
              const endAngle = startAngle + (item.value / total) * 360;
              const startAngleRad = (startAngle - 90) * Math.PI / 180;
              const endAngleRad = (endAngle - 90) * Math.PI / 180;
              
              const innerRadius = 60;
              const outerRadius = 100;
              
              const x1 = Math.cos(startAngleRad) * outerRadius;
              const y1 = Math.sin(startAngleRad) * outerRadius;
              const x2 = Math.cos(endAngleRad) * outerRadius;
              const y2 = Math.sin(endAngleRad) * outerRadius;
              const x3 = Math.cos(endAngleRad) * innerRadius;
              const y3 = Math.sin(endAngleRad) * innerRadius;
              const x4 = Math.cos(startAngleRad) * innerRadius;
              const y4 = Math.sin(startAngleRad) * innerRadius;
              
              const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`}
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}
            <circle cx="0" cy="0" r="35" fill="#f4f4f4" stroke="#e0e0e0" strokeWidth="1"/>
            <text x="0" y="15" textAnchor="middle" fontSize="10" fill="#525252">Total</text>
            <text x="0" y="0" textAnchor="middle" fontSize="14" fontWeight="900" fill="#161616">₹{(totalAmount / 1000).toFixed(0)}K</text>
          </g>
        </svg>
      </div>
      
      {/* Legend */}
      <div className={styles.donutChartLegend}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.map((entry, index) => (
            <div key={index} className={styles.donutChartLegendItem}>
              <div 
                className={styles.donutChartLegendColor}
                style={{ backgroundColor: entry.color }}
              />
              <span className={styles.donutChartLegendName}>{entry.name}</span>
              <span className={styles.donutChartLegendValue} style={{ color: entry.color }}>
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Custom IBM-styled Bar Chart Component
const IBMBarChart: React.FC<{ data: any[] }> = ({ data }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient || !data || data.length === 0) {
    return (
      <div className={styles.skeletonBarChart}>
        <SkeletonText />
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.amount));
  const maxNameLength = 20; // Increased character limit for merchant names
  
  const truncateName = (name: string) => {
    if (name.length <= maxNameLength) return name;
    return name.substring(0, maxNameLength - 3) + '...';
  };
  
  return (
    <div className={styles.barChartContainer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map((item, index) => (
          <div 
            key={index} 
            className={styles.barChartItem}
          >
            {/* Merchant Name */}
            <div className={styles.barChartMerchant}>
              {truncateName(item.merchant)}
            </div>
            
            {/* Progress Bar */}
            <div className={styles.barChartProgress}>
              <div className={styles.barChartProgressBar}>
                <div 
                  className={styles.barChartProgressFill}
                  style={{ width: `${Math.round((item.amount / maxValue) * 100)}%` }}
                />
              </div>
            </div>
            
            {/* Amount */}
            <div className={styles.barChartAmount}>
              ₹{item.amount >= 100000 
                ? `${(item.amount / 100000).toFixed(1)}L` 
                : `${(item.amount / 1000).toFixed(1)}K`}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className={styles.barChartLegend}>
        Top {data.length} merchants by transaction volume
      </div>
    </div>
  );
};

// Helper for tick formatting
function formatMonthTick(tick: any) {
  // Only format if tick is a string in 'YYYY-MM' format
  if (typeof tick === 'string' && /^\d{4}-\d{2}$/.test(tick)) {
    const d = new Date(tick + '-01');
    return format(d, 'MMM'); // Only month abbreviation
  }
  if (tick instanceof Date) {
    return format(tick, 'MMM');
  }
  return tick;
}

// Defensive chart data filter
function getValidChartData(monthlySpending: any[]): { group: string; date: string; value: number }[] {
  if (!Array.isArray(monthlySpending)) return [];
  return monthlySpending
    .filter(item => {
      // Only allow valid, finite, non-null, non-negative numbers for amount
      if (!item) return false;
      if (typeof item.month !== 'string' || !/^\d{4}-\d{2}$/.test(item.month)) return false;
      const amount = Number(item.amount);
      if (item.amount === null || item.amount === undefined) return false;
      if (isNaN(amount) || !Number.isFinite(amount) || amount < 0) return false;
      return true;
    })
    .map(item => ({
      group: 'Spending',
      date: item.month,
      value: Number(item.amount)
    }))
    .filter(d => typeof d.date === 'string' && /^\d{4}-\d{2}$/.test(d.date) && Number.isFinite(d.value));
}

// Custom Tooltip for Recharts LineChart
const CustomTooltip = ({ active, payload, label, monthlySummary }: any) => {
  if (active && payload && payload.length && monthlySummary) {
    // Find the summary for the hovered month
    const month = label;
    const monthData = Array.isArray(monthlySummary)
      ? monthlySummary.find((m) => m.month === month)
      : null;
    return (
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1rem', minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 600, color: '#0f62fe', marginBottom: 4 }}>{month ? formatMonthTick(month) : ''}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#161616', marginBottom: 8 }}>
          ₹{payload[0].value.toLocaleString()}
        </div>
        <hr style={{ margin: '0.5rem 0' }} />
        <div style={{ fontSize: '0.95rem', color: '#525252', marginBottom: 2 }}>
          <span style={{ fontWeight: 500 }}>Total Transactions:</span> {monthData ? monthData.count : '-'}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#525252', marginBottom: 2 }}>
          <span style={{ fontWeight: 500 }}>Average Amount:</span> ₹{monthData ? monthData.average.toLocaleString() : '-'}
        </div>
      </div>
    );
  }
  return null;
};

const CustomerProfile: React.FC<CustomerProfileProps> = ({ response, loading }) => {
  const [isClient, setIsClient] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Merchants table scroll/arrow logic hooks (must be at top level)
  const merchants = Array.isArray(profileData?.top_merchants) ? profileData.top_merchants : [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);

  // Track scroll position to hide arrow at bottom
  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setShowArrow(el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setShowArrow(el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [merchants.length]);

  const handleArrowClick = () => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    setIsClient(true);
    // Parse JSON data from backend
    if (response) {
      setProfileData(response);
    } else {
      setProfileData(null);
    }
  }, [response]);

  // Defensive: get valid chart data
  const chartData = getValidChartData(profileData?.spending_summary?.monthly_spending || []);
  // Exclude current month from months count
  const now = new Date();
  const monthsArray = Array.isArray(profileData?.spending_summary?.monthly_spending)
    ? profileData.spending_summary.monthly_spending.map(m => m.month)
    : [];
  const filteredMonths = monthsArray.filter(monthStr => {
    // monthStr is 'YYYY-MM'
    const [year, month] = monthStr.split('-').map(Number);
    if (!year || !month) return false;
    const monthDate = new Date(year, month - 1, 1);
    return !isSameMonth(monthDate, now);
  });
  const numMonths = filteredMonths.length;

  // Use real recent transactions from API (first 5), with null safety
  const topTransactions = Array.isArray(profileData?.recent_transactions)
    ? profileData.recent_transactions.slice(0, 5)
    : [];

  // Show skeleton while client-side hydration completes or loading
  if (!isClient || loading) {
    return (
      <Grid>
        <Column lg={16} md={16} sm={16}>
          <Tile className={styles.skeletonContainer}>
            <SkeletonText />
          </Tile>
        </Column>
      </Grid>
    );
  }

  // Show error if profile data is not available or does not have a customer name
  if (!profileData || !profileData.customer || !profileData.customer.name) {
    return (
      <Grid>
        <Column lg={16} md={16} sm={16}>
          <Tile className={styles.errorContainer}>
            <InlineNotification
              kind="error"
              title="Error"
              subtitle="Unable to load customer profile data"
            />
          </Tile>
        </Column>
      </Grid>
    );
  }

  return (
    <div className={styles.pageContainer} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid style={{ flex: 1, minHeight: 0, height: '100vh', alignItems: 'stretch' }}>
        {/* Left Side - Card Image and Card Details */}
        <Column lg={8} md={8} sm={16} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          <Tile className={styles.customerDetailsTile} style={{ background: '#fff', boxShadow: 'none', padding: '1.5rem 1.5rem', border: 'none', flex: '0 0 auto' }}>
            {/* Card Details Title and Subtitle - at the very top of the tile */}
            <div className={styles.customerDetailsHeader}>
              <h3 className={styles.customerDetailsTitle}>Card Details</h3>
              <div className={styles.customerDetailsSubtitle}>Your active credit card details</div>
            </div>
            {/* Main card content container */}
            <div>
            {/* Label/tag row (Category) */}
              {(profileData.customer?.category || profileData.customer?.card_category) && (
                <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  Category:
                  <Tag type="gray" size="sm">{profileData.customer.category || profileData.customer.card_category}</Tag>
                </span>
                </div>
              )}
            {/* Main row: Available Limit & Current Balance (left), Card Image (center), Credit Limit & Reward Points (right) */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2.5rem',
              width: '100%',
              marginTop: '1.25rem',
            }}>
              {/* Available Limit & Current Balance (left) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2.5rem', minWidth: 120 }}>
                {/* Available Limit */}
                {profileData.customer?.available_limit && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 100 }}>
                    <Money size={24} style={{ margin: '0 0 0.25rem 0', color: '#24a148' }} />
                    <span className={styles.fieldValueRegular} style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>₹{profileData.customer.available_limit.toLocaleString()}</span>
                    <span className={styles.fieldLabel} style={{ textAlign: 'right' }}>Available Limit</span>
                  </div>
                )}
                {/* Current Balance */}
                {profileData.customer?.current_balance !== undefined && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 100 }}>
                    <Wallet size={24} style={{ margin: '0 0 0.25rem 0', color: '#a86c2c' }} />
                    <span className={styles.fieldValueRegular} style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>₹{profileData.customer.current_balance.toLocaleString()}</span>
                    <span className={styles.fieldLabel} style={{ textAlign: 'right' }}>Current Balance</span>
                  </div>
                )}
              </div>
              {/* Card Image (center) */}
              {profileData.customer?.image_url && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '240px', minHeight: '160px', position: 'relative' }}>
                  <img
                    src={profileData.customer.image_url || '/bob.png'}
                    alt={profileData.customer.card_type || 'Card Image'}
                    style={{ width: '240px', height: '160px', objectFit: 'contain', borderRadius: '12px' }}
                    onError={e => { e.currentTarget.src = '/bob.png'; }}
                  />
                </div>
              )}
              {/* Credit Limit & Reward Points (right) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2.5rem', minWidth: 120 }}>
                {/* Credit Limit */}
                {profileData.customer?.credit_limit && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 100 }}>
                    <Analytics size={24} style={{ margin: '0 0 0.25rem 0', color: '#0f62fe' }} />
                    <span className={styles.fieldValueRegular} style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>₹{profileData.customer.credit_limit.toLocaleString()}</span>
                    <span className={styles.fieldLabel} style={{ textAlign: 'left' }}>Credit Limit</span>
                  </div>
                )}
                {/* Reward Points */}
                {profileData.customer?.reward_points !== undefined && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 100 }}>
                    <Currency size={24} style={{ margin: '0 0 0.25rem 0', color: '#f1c21b' }} />
                    <span className={styles.fieldValue} style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{profileData.customer.reward_points}</span>
                    <span className={styles.fieldLabel} style={{ textAlign: 'left' }}>Reward Points</span>
                  </div>
                )}
                </div>
              </div>
            </div>
          </Tile>

          {/* Monthly Spending Line Chart */}
          {Array.isArray(chartData) && chartData.length > 0 ? (
            <Tile style={{ marginTop: 0, background: '#fff', padding: '1rem 1.25rem', flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h4 style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, fontSize: '1.15rem', color: '#161616' }}>
                Monthly Spending Trend
              </h4>
              <div style={{ color: '#8d8d8d', fontSize: '0.97rem', marginBottom: '0.5rem' }}>
                See how your total monthly spending changes over time.
                  </div>
              <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>
                <div style={{ width: '100%', maxWidth: 700, minWidth: 320, height: '100%', minHeight: 0, padding: 0, display: 'flex' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatMonthTick}
                        interval={0} // Show all ticks
                        minTickGap={0}
                      />
                      <YAxis
                        dataKey="value"
                        tickFormatter={v => `₹${v.toLocaleString()}`}
                        allowDecimals={false}
                        width={70}
                      />
                      <Tooltip
                        content={props => <CustomTooltip {...props} monthlySummary={profileData.spending_summary?.monthly_spending} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0f62fe"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Tile>
          ) : (
            <Tile style={{ marginTop: 0, background: '#fff', padding: '1rem 1.25rem', textAlign: 'center', color: '#8d8d8d', flex: '1 1 0%', minHeight: 0 }}>
              <h4 style={{ margin: 0, marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.15rem', color: '#161616' }}>Monthly Spending Trend</h4>
              <div>No valid monthly spending data available.</div>
            </Tile>
          )}
        </Column>

        {/* Right Side - Top Transactions */}
        <Column lg={8} md={8} sm={16} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          {/* Top Transactions */}
          {profileData.spending_summary && (
            <Tile className={styles.transactionPatternsTile} style={{ flex: '1 1 0%', minHeight: 0, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 0 }}>
              <div className={styles.transactionPatternsHeader} style={{ marginBottom: '0.5rem' }}>
                <h3 className={styles.transactionPatternsTitle}>
                  Top Transactions
                </h3>
                <p className={styles.transactionPatternsSubtitle} style={{ color: '#8d8d8d', fontSize: '0.97rem', margin: 0, marginBottom: 4 }}>
                  {numMonths > 0
                    ? `See your most frequent or highest-value merchants in the last ${numMonths} month${numMonths === 1 ? '' : 's'}.`
                    : ''}
                </p>
              </div>
              {/* Top Merchants (by volume) */}
              <div className={styles.topMerchantsSection} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginTop: 0, paddingTop: 0 }}>
                {/* Merchants Table with fixed height and scrollable body */}
                <div style={{ width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', color: '#525252', fontWeight: 600, width: 220 }}>Merchant</th>
                        <th style={{ padding: '0.5rem 1rem', textAlign: 'center', color: '#525252', fontWeight: 600, width: 130 }}>Category</th>
                        <th style={{ padding: '0.5rem 1rem', textAlign: 'right', color: '#525252', fontWeight: 600, width: 120 }}>Amount</th>
                      </tr>
                    </thead>
                  </table>
                  <div className={styles.tableScroll} style={{ maxHeight: 300, overflowY: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                      <tbody>
                        {merchants.map((merchant, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <td style={{ padding: '0.5rem 1rem', color: '#161616', textAlign: 'left', width: 220 }}>{merchant.merchant || '-'}</td>
                            <td style={{ padding: '0.5rem 1rem', color: '#161616', textAlign: 'center', width: 130, verticalAlign: 'middle' }}>{merchant.category || '-'}</td>
                            <td style={{ padding: '0.5rem 1rem', color: '#0f62fe', textAlign: 'right', fontWeight: 600, width: 120 }}>
                              {typeof merchant.amount === 'number' && !isNaN(merchant.amount)
                                ? `₹${merchant.amount.toLocaleString()}`
                                : (typeof merchant.amount === 'string'
                                  ? (() => {
                                      const cleaned = merchant.amount.replace(/[^\d.\-]/g, '');
                                      const num = parseFloat(cleaned);
                                      return isNaN(num) ? '-' : `₹${num.toLocaleString()}`;
                                    })()
                                  : '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {showArrow && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, cursor: 'pointer', marginBottom: 0 }} onClick={handleArrowClick}>
                    <ChevronDown size={20} aria-label="Scroll down for more" style={{ color: '#8d8d8d' }} />
                  </div>
                )}
              </div>
            </Tile>
          )}
          {/* Category Distribution (compact) */}
          {profileData.category_distribution && profileData.category_distribution.length > 0 && (
            <Tile className={styles.categoryDistributionTile} style={{ flex: '0 0 auto', padding: '0.75rem 1rem', minHeight: 0, fontSize: '0.92rem', marginTop: 0 }}>
              <div className={styles.categoryDistributionHeader} style={{ marginBottom: 8 }}>
                <h3 className={styles.categoryDistributionTitle} style={{ fontSize: '1.05rem', marginBottom: 2 }}>
                  Category Distribution
                </h3>
                <p className={styles.categoryDistributionSubtitle} style={{ color: '#8d8d8d', fontSize: '0.97rem', margin: 0, marginBottom: 4 }}>
                  {numMonths > 0
                    ? `Showing category-wise spend for the last ${numMonths} month${numMonths === 1 ? '' : 's'}`
                    : ''}
                </p>
              </div>
              {/* Assign color to each category */}
              <IBMDonutChart data={profileData.category_distribution.map((cat: any, idx: number) => ({
                ...cat,
                color: donutPalette[idx % donutPalette.length]
              }))} />
            </Tile>
          )}
        </Column>
      </Grid>
    </div>
  );
};

export default CustomerProfile;