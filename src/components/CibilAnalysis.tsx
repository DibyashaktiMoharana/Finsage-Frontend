'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Column,
  Tile,
  Tag,
  Loading,
  ProgressBar,
  Stack,
  AspectRatio,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  ContainedList,
  ContainedListItem
} from '@carbon/react';
import {
  ChartLine,
  ArrowUp,
  ArrowDown,
  CheckmarkFilled,
  WarningFilled,
  Growth,
  Information,
  Wallet,
  Money,
  Calendar,
  ChartBar,
  Flag
} from '@carbon/icons-react';
import { DonutChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import styles from './styles/CibilAnalysis.module.css';

// Semicircular Gauge component
const SemicircularGauge: React.FC<{ score: number, previousScore: number }> = ({ score, previousScore }) => {
  const [animate, setAnimate] = useState(false);
  const [needleAngle, setNeedleAngle] = useState(-90); // Start at -90 (far left)
  const [animatedDiff, setAnimatedDiff] = useState(0);
  const [arrowVisible, setArrowVisible] = useState(false);
  const animatedScoreRef = useRef(0);
  const [, forceRerender] = useState(0); // dummy state to force re-render

  // Arc animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Needle animation (sync with arc)
  useEffect(() => {
    if (animate) {
      const minScore = 300;
      const maxScore = 900;
      const normalizedScore = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
      const targetAngle = -90 + (normalizedScore * 180);
      // Animate needle smoothly
      let frame: number;
      let start: number | null = null;
      const duration = 1500; // ms
      const initialAngle = -90;
      function animateNeedle(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = initialAngle + (targetAngle - initialAngle) * progress;
        setNeedleAngle(currentAngle);
        if (progress < 1) {
          frame = requestAnimationFrame(animateNeedle);
        }
      }
      frame = requestAnimationFrame(animateNeedle);
      return () => cancelAnimationFrame(frame);
    }
  }, [animate, score]);

  // Animate CIBIL score number using ref and force update
  useEffect(() => {
    if (animate) {
      animatedScoreRef.current = 0;
      forceRerender(n => n + 1);
      let frame: number;
      let start: number | null = null;
      const duration = 1200;
      const from = 0;
      const to = score;
      function animateScore(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(from + (to - from) * progress);
        if (animatedScoreRef.current !== value) {
          animatedScoreRef.current = value;
          forceRerender(n => n + 1);
        }
        if (progress < 1) {
          frame = requestAnimationFrame(animateScore);
        }
      }
      frame = requestAnimationFrame(animateScore);
      return () => cancelAnimationFrame(frame);
    }
  }, [animate, score]);

  // Animate points diff number and arrow
  useEffect(() => {
    if (animate) {
      let frame: number;
      let start: number | null = null;
      const duration = 900;
      const diff = Math.abs(score - previousScore);
      function animateDiff(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        setAnimatedDiff(Math.round(diff * progress));
        if (progress < 1) {
          frame = requestAnimationFrame(animateDiff);
        } else {
          setArrowVisible(true);
        }
      }
      frame = requestAnimationFrame(animateDiff);
      return () => cancelAnimationFrame(frame);
    }
  }, [animate, score, previousScore]);

  const getScoreCategory = (score: number) => {
    if (score < 550) return { label: 'Very Poor', color: 'var(--cds-support-error)' };
    if (score < 650) return { label: 'Poor', color: 'var(--cds-support-warning)' };
    if (score < 700) return { label: 'Fair', color: 'var(--cds-support-info)' };
    if (score < 750) return { label: 'Good', color: 'var(--cds-support-success)' };
    return { label: 'Excellent', color: 'var(--cds-support-success)' };
  };

  const { label, color } = getScoreCategory(score);
  const scoreDiff = score - previousScore;
  const isPositive = scoreDiff >= 0;

  // True semicircle arc
  const minScore = 300;
  const maxScore = 900;
  const normalizedScore = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
  const radius = 110;
  const strokeWidth = 16;
  const centerX = 160;
  const centerY = 180;
  const startX = centerX - radius;
  const startY = centerY;
  const endX = centerX + radius;
  const endY = centerY;
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = animate ? circumference * (1 - normalizedScore) : circumference;

  return (
    <div className={styles.gaugeContainer}>
      {/* Gauge at the top */}
      <svg width="320" height="200" viewBox="0 0 320 200" className={styles.gaugeSvg}>
          {/* Background arc */}
          <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
          stroke="var(--cds-layer-selected-01)"
            strokeWidth={strokeWidth}
          strokeLinecap="butt"
          />
        {/* Gradient definition */}
          <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--cds-support-error)" />
            <stop offset="50%" stopColor="var(--cds-support-warning)" />
            <stop offset="100%" stopColor="var(--cds-support-success)" />
            </linearGradient>
          {/* Metallic gradient for base */}
          <radialGradient id="needleBaseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="60%" stopColor="#b0b0b0" />
            <stop offset="100%" stopColor="#888" />
          </radialGradient>
          {/* Needle shadow */}
          <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
          </filter>
          </defs>
        {/* Progress arc */}
          <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
          stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
          strokeLinecap="butt"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          className={styles.gaugeProgressArc}
        />
        {/* Realistic Needle */}
        <g transform={`translate(${centerX}, ${centerY}) rotate(${needleAngle})`} className={styles.gaugeNeedleGroup}>
          {/* Needle polygon (tapered) */}
          <polygon
            points="-4,0 0,-100 4,0"
            fill="#222"
            filter="url(#needleShadow)"
          />
          {/* Needle base (metallic) */}
          <circle cx="0" cy="0" r="10" fill="url(#needleBaseGradient)" stroke="#666" strokeWidth="1.5" />
          {/* Needle center cap */}
          <circle cx="0" cy="0" r="4" fill="#fff" stroke="#888" strokeWidth="1" />
        </g>
          {/* Score markers */}
        <text x={startX} y={centerY + 20} fontSize="13" fill="var(--cds-text-secondary)" textAnchor="middle">300</text>
        <text x={centerX} y={centerY - radius + 30} fontSize="13" fill="var(--cds-text-secondary)" textAnchor="middle">600</text>
        <text x={endX} y={centerY + 20} fontSize="13" fill="var(--cds-text-secondary)" textAnchor="middle">900</text>
        </svg>
      {/* Score, label, and points change group below the gauge */}
      <div className={styles.scoreDisplay}>
                <div className={styles.scoreNumber} style={{ color }}>
          {animatedScoreRef.current}
                </div>
        <Tag 
          type={
            label === 'Excellent' || label === 'Good' ? 'green' :
            label === 'Fair' ? 'blue' :
            label === 'Poor' ? 'red' :
            'red'
          } 
          size="sm" 
          className={styles.scoreTag}
        >
          {label}
        </Tag>
        {/* Points increase/decrease visually appealing */}
      <div className={styles.scoreChangeContainer} style={{ color: isPositive ? 'var(--cds-support-success)' : 'var(--cds-support-error)' }}>
          <span className={`${styles.scoreArrow} ${arrowVisible ? styles.scoreArrowVisible : styles.scoreArrowHidden}`}>
            {isPositive ? <ArrowUp size={24} /> : <ArrowDown size={24} />}
          </span>
          <span className={styles.scoreChangeValue}>
            {isPositive ? '+' : '-'}{animatedDiff}
          </span>
          <span className={styles.scoreChangeLabel}>
            points
          </span>
        </div>
      </div>
    </div>
  );
};

// Animated Credit Utilization Gauge
const CreditUtilizationChart: React.FC<{ utilization: number }> = ({ utilization }) => {
  const [animate, setAnimate] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  // Validate and sanitize the utilization value
  const validUtilization = typeof utilization === 'number' && isFinite(utilization) && !isNaN(utilization) ? utilization : 0;

  useEffect(() => {
    setAnimate(false);
    setAnimatedValue(0);
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [validUtilization]);

  useEffect(() => {
    if (animate) {
      let frame: number;
      let start: number | null = null;
      const duration = 1200;
      const from = 0;
      const to = Math.round(validUtilization);
      function animateUtil(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(from + (to - from) * progress);
        setAnimatedValue(isFinite(value) && !isNaN(value) ? value : 0);
        if (progress < 1) {
          frame = requestAnimationFrame(animateUtil);
        }
      }
      frame = requestAnimationFrame(animateUtil);
      return () => cancelAnimationFrame(frame);
    }
  }, [animate, validUtilization]);

  // Gauge parameters
  const radius = 70;
  const strokeWidth = 18;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  const used = Math.max(0, Math.min(100, isFinite(animatedValue) && !isNaN(animatedValue) ? animatedValue : 0));
  const usedLength = (used / 100) * circumference;
  const unusedLength = circumference - usedLength;

  // Dynamic color
  let arcColor = 'var(--cds-support-success)'; // green
  if (used >= 60) arcColor = 'var(--cds-support-error)'; // red
  else if (used >= 30) arcColor = 'var(--cds-support-warning)'; // yellow

  return (
    <div className={styles.utilizationContainer}>
      <svg width={200} height={200} viewBox="0 0 200 200" className={styles.utilizationSvg}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--cds-layer-selected-01)"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          transform="rotate(-90 100 100)"
        />
        {/* Used arc (animated) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={isFinite(circumference * (1 - used / 100)) ? circumference * (1 - used / 100) : circumference}
          strokeLinecap="butt"
          transform="rotate(-90 100 100)"
          className={styles.utilizationArc}
        />
        {/* Center label */}
        <text x={center} y={center + 8} textAnchor="middle" fontSize="32" fontWeight="700" fill={arcColor}>
          {used}%
        </text>
        <text x={center} y={center + 32} textAnchor="middle" fontSize="13" fill="#8d8d8d">
          Card Util.
        </text>
      </svg>
      {/* Legend: Used and Unused, centered and aligned */}
      <div className={styles.utilizationLegend}>
        <div className={styles.utilizationLegendItem}>
          <span className={styles.utilizationLegendDot} style={{ background: arcColor }} />
          <span className={styles.utilizationLegendText}>Used</span>
        </div>
        <div className={styles.utilizationLegendItem}>
          <span className={styles.utilizationLegendDot} style={{ background: 'var(--cds-layer-selected-01)' }} />
          <span className={styles.utilizationLegendText}>Unused</span>
        </div>
      </div>
    </div>
  );
};

// Redesigned Key Metric Tile
const MetricTile: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  accentColor: string;
  helper?: string;
}> = ({ icon, value, label, accentColor, helper }) => {
  // Determine color variant based on accent color
  const getColorVariant = (color: string) => {
    if (color.includes('success')) return 'Green';
    if (color.includes('info')) return 'Blue';
    if (color.includes('warning')) return 'Yellow';
    if (color.includes('error')) return 'Red';
    return 'Green';
  };

  const colorVariant = getColorVariant(accentColor);

  return (
      <div className={`${styles.metricTile} ${styles[`metricTile${colorVariant}`]}`}>
      <div className={`${styles.metricIcon} ${styles[`metricIcon${colorVariant}`]}`}>{icon}</div>
    <div className={`${styles.metricValue} ${styles[`metricValue${colorVariant}`]}`}>{value}</div>
    <div className={styles.metricLabel}>{label}</div>
    {helper && <div className={styles.metricHelper}>{helper}</div>}
    </div>
  );
};

// Enhanced FinancialOverviewCard with shadow
const FinancialOverviewCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}> = ({ label, value, icon, trend }) => {
  return (
    <div className={`cds--tile ${styles.financialOverviewCard}`}>
        <div className={styles.financialOverviewHeader}>
          {icon}
        <span className="cds--type-body-compact-01">{label}</span>
        </div>
      <div className="cds--type-productive-heading-03">
        {value}
      </div>
      {trend && (
        <div className={`cds--type-body-compact-01 ${styles.financialOverviewTrend} ${trend.isPositive ? styles.financialOverviewTrendPositive : styles.financialOverviewTrendNegative}`}>
          {trend.isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {trend.value}%
        </div>
      )}
    </div>
  );
};

interface CibilData {
  // Score overview
  previous_cibil_score: number;
  current_cibil_score: number;
  score_improvement: number;
  score_range: string;
  score_description: string;

  // Credit profile (backend keys, always arrays)
  credit_cards: Array<{
    card_name: string;
    card_limits: number;
    avg_usage: number;
    card_opened_year: number;
    credit_utilization?: number;
    missed_emi?: number;
  }>;
  loans: Array<{
    loan_type: string;
    loan_amount: number;
    loan_emi: number;
    loan_start_date: string;
    loan_status: string;
    missed_emi: number;
    missed_emi_months: string[];
  }>;
  settled_accounts: Array<{
    settled_accounts: string;
  }>;

  // Key metrics
  avg_credit_utilization: number;
  hard_inquiries_last_12_months: number;
  missed_emi_count: number;
  settled_accounts_count: number;

  // Analysis
  positive_factors: string[];
  negative_factors: string[];

  // Recommendations
  immediate_actions: string[];
  long_term_actions: string[];

  // Summary
  current_status: string;
  areas_of_improvement: string;
  future_outlook: string;
}

const CibilAnalysis: React.FC<{
  response?: any;
  loading?: boolean;
}> = ({ response, loading = false }) => {
  const [loadingData, setLoadingData] = useState(true);
  const [cibilData, setCibilData] = useState<CibilData>({
    previous_cibil_score: 0,
    current_cibil_score: 0,
    score_improvement: 0,
    score_range: '',
    score_description: '',
    credit_cards: [],
    loans: [],
    settled_accounts: [],
    avg_credit_utilization: 0,
    hard_inquiries_last_12_months: 0,
    missed_emi_count: 0,
    settled_accounts_count: 0,
    positive_factors: [],
    negative_factors: [],
    immediate_actions: [],
    long_term_actions: [],
    current_status: '',
    areas_of_improvement: '',
    future_outlook: ''
  });

  useEffect(() => {
    if (response?.result) {
      try {
        const result = response.result;
        setCibilData({
          previous_cibil_score: result.score_overview?.previous_cibil_score ?? 0,
          current_cibil_score: result.score_overview?.current_cibil_score ?? 0,
          score_improvement: result.score_overview?.score_improvement ?? 0,
          score_range: result.score_overview?.score_range ?? '',
          score_description: result.score_overview?.score_description ?? '',

          credit_cards: result.credit_profile?.credit_card ? [result.credit_profile.credit_card] : [],
          loans: result.credit_profile?.loans ? [result.credit_profile.loans] : [],
          settled_accounts: result.credit_profile?.other_accounts ? [result.credit_profile.other_accounts] : [],

          avg_credit_utilization: result.key_metrics?.avg_credit_utilization ?? 0,
          hard_inquiries_last_12_months: result.key_metrics?.hard_inquiries_last_12_months ?? 0,
          missed_emi_count: result.key_metrics?.missed_emi_count ?? 0,
          settled_accounts_count: result.key_metrics?.settled_accounts ?? 0,

          positive_factors: result.factors_analysis?.positive_factors ?? [],
          negative_factors: result.factors_analysis?.negative_factors ?? [],

          immediate_actions: result.recommendations?.immediate_actions ?? [],
          long_term_actions: result.recommendations?.long_term_actions ?? [],

          current_status: result.summary?.current_status ?? '',
          areas_of_improvement: result.summary?.areas_of_improvement ?? '',
          future_outlook: result.summary?.future_outlook ?? ''
        });
      } catch (error) {
        console.error("Error parsing CIBIL data:", error);
      }
      setLoadingData(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingData(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [response]);

  const isLoading = loading || loadingData;
  if (isLoading) return null;



  // Section Title with Subtitle
  const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className={styles.sectionHeader}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
  );

  // Financial Details Grid
  const FinancialDetails: React.FC<{ cibilData: CibilData }> = ({ cibilData }) => (
    <div className={styles.financialDetailsGrid}>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <Wallet size={20} style={{marginBottom: 2, color: 'var(--cds-support-info)'}} />
          Credit Cards
        </span>
        <div className={styles.financialValue}>{cibilData.credit_cards.length}</div>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <ChartBar size={20} style={{marginBottom: 2, color: 'var(--cds-support-success)'}} />
          Active Loans
        </span>
        <div className={styles.financialValue}>{Array.isArray(cibilData.loans) ? cibilData.loans.filter(loan => loan.loan_status === 'Active').length : 0}</div>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <Information size={20} style={{marginBottom: 2, color: 'var(--cds-support-info)'}} />
          Loan Type
        </span>
        <div className={styles.financialValue}>{Array.isArray(cibilData.loans) && cibilData.loans[0]?.loan_type || 'N/A'}</div>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <Money size={20} style={{marginBottom: 2, color: 'var(--cds-support-success)'}} />
          Loan Amount
        </span>
        <div className={styles.financialValue}>{Array.isArray(cibilData.loans) && cibilData.loans[0]?.loan_amount ? cibilData.loans[0].loan_amount.toLocaleString() : '0'}</div>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <Growth size={20} style={{marginBottom: 2, color: 'var(--cds-support-info)'}} />
          Monthly EMI
        </span>
        <div className={styles.financialValue}>{Array.isArray(cibilData.loans) && cibilData.loans[0]?.loan_emi ? cibilData.loans[0].loan_emi.toLocaleString() : '0'}</div>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <Calendar size={20} style={{marginBottom: 2, color: 'var(--cds-support-warning)'}} />
          Loan Start Date
        </span>
        <div className={styles.financialValue}>{Array.isArray(cibilData.loans) && cibilData.loans[0]?.loan_start_date || 'N/A'}</div>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <CheckmarkFilled size={20} style={{marginBottom: 2, color: 'var(--cds-support-success)'}} />
          Loan Status
        </span>
        <Tag type={Array.isArray(cibilData.loans) && cibilData.loans[0]?.loan_status === 'Active' ? 'green' : 'blue'}>{Array.isArray(cibilData.loans) && cibilData.loans[0]?.loan_status || 'N/A'}</Tag>
      </div>
      <div>
        <span className={styles.financialLabel} style={{flexDirection: 'column', alignItems: 'center', display: 'flex'}}>
          <WarningFilled size={20} style={{marginBottom: 2, color: 'var(--cds-support-error)'}} />
          Hard Inquiries (12M)
        </span>
        <div className={styles.financialValue}>{cibilData.hard_inquiries_last_12_months}</div>
      </div>
      {/* {cibilData.settled_accounts.length > 0 && (
        <div className={styles.financialDetailsWarning}>
          <Tag type="red">Settled Accounts: {cibilData.settled_accounts.length}</Tag>
        </div>
      )} */}
    </div>
  );

  // Recommendations & Impact Factors Combined Tile
  const RecommendationsAndFactors: React.FC<{ cibilData: CibilData }> = ({ cibilData }) => {
    // Combine all recommendations
    const allRecommendations = [
      ...(Array.isArray(cibilData.immediate_actions) ? cibilData.immediate_actions : []),
      ...(Array.isArray(cibilData.long_term_actions) ? cibilData.long_term_actions : []),

    ];
    
    // Combine all factors
    const allFactors = [
      ...(Array.isArray(cibilData.positive_factors) ? cibilData.positive_factors : []),
      ...(Array.isArray(cibilData.negative_factors) ? cibilData.negative_factors : []),
    ];

    return (
      <div className={styles.recommendationsContainer} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.recommendationsContent} style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
          <div className={styles.recommendationsSection} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className={styles.financialLabel}>Recommendations</span>
            <div className={styles.recommendationsList} style={{ flex: 1, minHeight: 0, maxHeight: '260px', overflowY: 'auto', paddingRight: 8 }}>
              {allRecommendations.map((recommendation, index) => (
                <div key={index} className={styles.recommendationsListItem}>
                  <div className={styles.recommendationsIcon}>
                    <CheckmarkFilled size={16} className={styles.recommendationsIconSuccess} />
                  </div>
                  <div className={styles.recommendationsText}>{recommendation}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className={styles.financialLabel}>Impact Factors</span>
            <div className={styles.recommendationsList} style={{ flex: 1, minHeight: 0, maxHeight: '260px', overflowY: 'auto', paddingRight: 8 }}>
              {allFactors.map((factor, index) => (
                <div key={index} className={styles.recommendationsListItem}>
                  <div className={styles.recommendationsIcon}>
                    <Information size={16} className={styles.recommendationsIconInfo} />
                  </div>
                  <div className={styles.recommendationsText}>{factor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // EMI Timeline Tile
  const EMITimeline: React.FC<{ missedMonths: string[] }> = ({ missedMonths }) => {
    // Generate last 12 months (including current)
    const now = new Date();
    const monthsShort: string[] = [];
    const monthsLong: string[] = [];
    const years: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsShort.push(d.toLocaleString('default', { month: 'short' }));
      monthsLong.push(d.toLocaleString('default', { month: 'long' }));
      years.push(d.getFullYear().toString());
    }

    // Normalize missedMonths to lowercase for comparison
    const missedSet = new Set((missedMonths || []).map(m => m.toLowerCase()));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SectionHeader title="EMI Payment Timeline" subtitle="Your EMI payment record for the last 12 months" />
        <div className={styles.emiTimelineContainer}>
          {monthsLong.map((monthLong, idx) => {
            // Mark as missed if the month name is in missedMonths
            const isMissed = missedSet.has(monthLong.toLowerCase());
            return (
              <div key={idx} className={styles.emiTimelineItem}>
                <div className={`${styles.emiTimelineDot} ${isMissed ? styles.emiTimelineDotMissed : styles.emiTimelineDotPaid}`} />
                <span className={styles.emiTimelineText}>{monthsShort[idx]}</span>
                <span className={styles.emiTimelineYear}>{years[idx]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className={styles.emiTimelineLegend}>
            <div className={styles.emiTimelineLegendItem}>
              <div className={`${styles.emiTimelineLegendDot} ${styles.emiTimelineLegendDotPaid}`} />
              <span>Paid on time</span>
            </div>
            <div className={styles.emiTimelineLegendItem}>
              <div className={`${styles.emiTimelineLegendDot} ${styles.emiTimelineLegendDotMissed}`} />
              <span>Missed payment</span>
            </div>
          </div>
          <div style={{ padding:'1rem', textAlign: 'center', marginTop: '1rem', fontWeight: 500, color: '#343434', fontSize: '1rem' }}>
            Missed EMIs: <span style={{ color: '#000000ff', fontWeight: 700 }}>{missedMonths.length}</span>
          </div>
        </div>
      </div>
    );
  };

  // Main return with Recommendations tile always on the far right
  return (
    <div className={styles.cibilRoot}>
      <div className={styles.cibilGrid}>
        <div className={`${styles.cibilTile} ${styles.gridAreaScore}`}>
          <SectionHeader title="CIBIL Score" subtitle="Your current credit score and change" />
          <SemicircularGauge score={cibilData.current_cibil_score} previousScore={cibilData.previous_cibil_score} />
        </div>
        <div className={`${styles.cibilTile} ${styles.gridAreaUtilization}`}>
          <SectionHeader title="Credit Utilization" subtitle="How much of your credit is being used" />
          <div className={styles.centeredFlex}>
            <CreditUtilizationChart utilization={cibilData.avg_credit_utilization} />
          </div>
          {/* Card Opened Year and Total Limit below the gauge */}
          <div className={styles.financialDetailsGrid} style={{ marginTop: '1rem' }}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <Flag size={20} style={{marginBottom: 2, color: 'var(--cds-support-info)'}} />
              <span className={styles.financialLabel}>Card Opened Year</span>
              <div className={styles.financialValue}>
                {cibilData.credit_cards.length > 0 &&
                  typeof cibilData.credit_cards[0].card_opened_year === 'number' &&
                  isFinite(cibilData.credit_cards[0].card_opened_year) &&
                  cibilData.credit_cards[0].card_opened_year > 1900
                  ? cibilData.credit_cards[0].card_opened_year
                  : 'N/A'}
              </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <ChartLine size={20} style={{marginBottom: 2, color: 'var(--cds-support-info)'}} />
              <span className={styles.financialLabel}>Total Limit</span>
              <div className={styles.financialValue}>
                ₹{(cibilData.credit_cards[0]?.card_limits || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.cibilTile} ${styles.gridAreaFinancial}`}>
          <SectionHeader title="Financial Details" subtitle="Your cards, loans, and accounts" />
          <FinancialDetails cibilData={cibilData} />
        </div>
        <div className={`${styles.cibilTile} ${styles.gridAreaTimeline}`}>
          <EMITimeline missedMonths={cibilData.loans.length > 0 ? cibilData.loans[0].missed_emi_months : []} />
        </div>
        <div className={`${styles.cibilTile} ${styles.gridAreaRecommendations}`}>
          <RecommendationsAndFactors cibilData={cibilData} />
        </div>
      </div>
    </div>
  );
};

export default CibilAnalysis;