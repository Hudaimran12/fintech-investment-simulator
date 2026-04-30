import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portfolioAPI, investmentAPI, alertAPI } from '../utils/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#4f8ef7', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ label, value, sub, color }) => (
  <div className="card" style={{ textAlign: 'center' }}>
    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{label}</p>
    <p style={{ fontSize: '1.6rem', fontWeight: 700, color: color || 'var(--text)', fontFamily: 'Space Mono' }}>{value}</p>
    {sub && <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>{sub}</p>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio]   = useState(null);
  const [stats, setStats]           = useState([]);
  const [unread, setUnread]         = useState(0);
  const [rankings, setRankings]     = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, sRes, aRes, rRes] = await Promise.all([
          portfolioAPI.get(),
          investmentAPI.aggregated(),
          alertAPI.getAll({ isRead: false }),
          portfolioAPI.rankings()
        ]);
        setPortfolio(pRes.data.portfolio);
        setStats(sRes.data.stats);
        setUnread(aRes.data.unreadCount);
        setRankings(rRes.data.rankings.slice(0, 5));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="spinner" />;

  const pnl     = portfolio ? portfolio.totalCurrentValue - portfolio.totalInvested : 0;
  const pnlPct  = portfolio?.totalInvested > 0
    ? ((pnl / portfolio.totalInvested) * 100).toFixed(2)
    : '0.00';

  // Pie data from allocation
  const alloc = portfolio?.assetAllocation || {};
  const pieData = Object.entries(alloc)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k.replace('_', ' '), value: parseFloat(v.toFixed(1)) }));

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Welcome back, {user?.name} 👋</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Roll: 23i-5544 | Investment Simulator + Alert System
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Total Invested" value={`$${(portfolio?.totalInvested || 0).toLocaleString()}`} />
        <StatCard label="Current Value"  value={`$${(portfolio?.totalCurrentValue || 0).toLocaleString()}`} color="var(--accent)" />
        <StatCard
          label="Total P&L"
          value={`${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          sub={`${pnlPct}%`}
          color={pnl >= 0 ? 'var(--green)' : 'var(--red)'}
        />
        <StatCard label="Unread Alerts" value={unread} color={unread > 0 ? 'var(--yellow)' : 'var(--green)'} />
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Risk + Diversification */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Portfolio Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ProgressBar label="Risk Score" value={portfolio?.riskScore || 0} max={100}
              color={portfolio?.riskScore > 70 ? 'var(--red)' : portfolio?.riskScore > 40 ? 'var(--yellow)' : 'var(--green)'} />
            <ProgressBar label="Diversification" value={portfolio?.diversificationScore || 0} max={100} color="var(--accent)" />
          </div>
        </div>

        {/* Asset Allocation Pie */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Asset Allocation</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '2rem' }}>No investments yet</p>
          )}
        </div>
      </div>

      {/* Performance by Asset Type (Aggregation Query 1) */}
      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Performance by Asset Type (Aggregation)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.map(s => ({ name: s._id, return: parseFloat(s.returnPercentage?.toFixed(2)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} formatter={v => [`${v}%`, 'Return']} />
              <Bar dataKey="return" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rankings (Aggregation Query 2) */}
      {rankings.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🏆 Leaderboard (Portfolio Rankings)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Investor</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Value</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Return</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td>
                  <td style={{ padding: '0.6rem' }}>{r.userInfo?.name || 'Unknown'}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right' }}>${(r.totalCurrentValue || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', color: r.returnPercentage >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {r.returnPercentage >= 0 ? '+' : ''}{parseFloat(r.returnPercentage || 0).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/investments" className="btn btn-primary">+ Add Investment</Link>
        <Link to="/alerts" className="btn btn-ghost">View Alerts {unread > 0 && `(${unread})`}</Link>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, value, max, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color }}>{value}/{max}</span>
    </div>
    <div style={{ background: 'var(--border)', borderRadius: 99, height: 8 }}>
      <div style={{ width: `${(value / max) * 100}%`, background: color, borderRadius: 99, height: '100%', transition: 'width 0.5s' }} />
    </div>
  </div>
);

export default DashboardPage;
