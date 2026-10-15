/**
 * OrdersView.js — Orders Overview page
 *
 * This page shows:
 *   - Stat cards: total revenue, total orders, unique customers
 *   - A bar/line chart of monthly revenue over time
 *   - A bar chart of revenue by city/state
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI — charts, stat cards, and layout.
 *
 * Useful libraries already installed:
 *   - recharts: BarChart, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { getSummary, getOrders, getCities } from '../utils/api';

function formatCurrency(value) {
  if (value == null) return '$0.00';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value) {
  if (value == null) return '0';
  return Number(value).toLocaleString('en-US');
}

export default function OrdersView() {
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate,   setEndDate]   = useState('2022-12-31');
  const [summary,   setSummary]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [cities,    setCities]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => { loadData(); }, []);

  function handleStartDateChange(e) {
    const val = e.target.value;
    setStartDate(val);
    if (!val || !endDate) {
      setError('Please select both start date and end date');
    } else if (val > endDate) {
      setError('End date must be on or after the start date');
    } else {
      setError(null);
    }
  }

  function handleEndDateChange(e) {
    const val = e.target.value;
    setEndDate(val);
    if (!startDate || !val) {
      setError('Please select both start date and end date');
    } else if (startDate > val) {
      setError('End date must be on or after the start date');
    } else {
      setError(null);
    }
  }

  async function loadData() {
    if (!startDate || !endDate) {
      setError('Please select both start date and end date');
      return;
    }
    if (startDate > endDate) {
      setError('End date must be on or after the start date');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, o, c] = await Promise.all([
        getSummary(),
        getOrders(startDate, endDate),
        getCities(startDate, endDate),
      ]);
      setSummary(s);
      setOrders(o);
      setCities(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={handleStartDateChange} />
          <label>To</label>
          <input type="date" value={endDate} onChange={handleEndDateChange} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
        </div>

        {/* ── Error state ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && <div className="loading">Loading orders data…</div>}

        {/* ── TODO: Build the UI here ────────────────────────────────────── */}
        {!loading && !error && (
          <>
            {/*
              STEP 1 — Stat cards
              Show total_revenue, total_orders, unique_customers from summary.
              Hint: use the .stat-row and .stat-box CSS classes.
              Available data: summary.total_revenue, summary.total_orders, summary.unique_customers
            */}
            <div className="stat-row">
              <div className="stat-box">
                <div className="label">Total Revenue</div>
                <div className="value">
                  {summary?.total_revenue != null ? formatCurrency(summary.total_revenue) : '$0.00'}
                </div>
              </div>
              <div className="stat-box">
                <div className="label">Total Orders</div>
                <div className="value">
                  {summary?.total_orders != null ? formatNumber(summary.total_orders) : '0'}
                </div>
              </div>
              <div className="stat-box">
                <div className="label">Unique Customers</div>
                <div className="value">
                  {summary?.unique_customers != null ? formatNumber(summary.unique_customers) : '0'}
                </div>
              </div>
            </div>

            {/*
              STEP 2 — Monthly revenue chart
              orders is an array of: { month, month_name, order_count, revenue }
              Use a BarChart or LineChart from recharts.
              Hint: XAxis dataKey="month_name", Bar dataKey="revenue"
            */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Monthly Revenue</div>
              {/* ResponsiveContainer ensures the chart auto-fits the parent container's width */}
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={orders} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  {/* Subtle horizontal grid lines for readability without visual clutter */}
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

                  {/* XAxis maps to the month_name field from the API */}
                  <XAxis
                    dataKey="month_name"
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />

                  {/* YAxis formats raw revenue amounts to abbreviated currency (e.g. $10k) */}
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />

                  {/* Tooltip formats hovered data with full currency formatting */}
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                    }}
                  />

                  {/* Bar element bound to the revenue dataKey styled with theme accent color */}
                  <Bar
                    dataKey="revenue"
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/*
              STEP 3 — Revenue by city chart
              cities is an array of: { city, state, order_count, revenue }
              Use a horizontal BarChart (layout="vertical").
              Show top 10 cities only.
              Hint: .slice(0, 10) on cities array
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Revenue by City</div>
              {/* ResponsiveContainer allows horizontal bar chart to scale responsively */}
              <ResponsiveContainer width="100%" height={320}>
                {/* layout="vertical" configures Recharts for horizontal bars (categories on YAxis, values on XAxis) */}
                <BarChart
                  data={cities.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  {/* Vertical grid lines assist in reading numeric values along the horizontal axis */}
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />

                  {/* XAxis configured as type="number" for numeric revenue scaling */}
                  <XAxis
                    type="number"
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />

                  {/* YAxis configured as type="category" mapping to city names; width allocates room for labels */}
                  <YAxis
                    type="category"
                    dataKey="city"
                    width={100}
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />

                  {/* Tooltip provides exact formatted currency values on hover */}
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                    }}
                  />

                  {/* Horizontal bars with right-side rounded corners using theme secondary/blue color */}
                  <Bar
                    dataKey="revenue"
                    fill="var(--blue)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
