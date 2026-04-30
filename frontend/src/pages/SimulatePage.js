import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { investmentAPI } from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SimulatePage = () => {
  const { id } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await investmentAPI.simulate(id);
        setData(res.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!data)   return <div style={{ padding: '2rem', color: 'var(--red)' }}>Investment not found.</div>;

  const { investment: inv, scenarios } = data;

  // Build chart data points for year 0, 1, 3, 5
  const chartData = [
    { year: 'Now',    conservative: inv.currentValue, moderate: inv.currentValue, aggressive: inv.currentValue },
    { year: '1 Year', conservative: scenarios.conservative.simulatedValue1Y, moderate: scenarios.moderate.simulatedValue1Y, aggressive: scenarios.aggressive.simulatedValue1Y },
    { year: '3 Years',conservative: scenarios.conservative.simulatedValue3Y, moderate: scenarios.moderate.simulatedValue3Y, aggressive: scenarios.aggressive.simulatedValue3Y },
    { year: '5 Years',conservative: scenarios.conservative.simulatedValue5Y, moderate: scenarios.moderate.simulatedValue5Y, aggressive: scenarios.aggressive.simulatedValue5Y }
  ];

  const pnl    = inv.currentValue - inv.amountInvested;
  const pnlPct = ((pnl / inv.amountInvested) * 100).toFixed(2);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <Link to="/investments" style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
        ← Back to Investments
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem' }}>
        📈 Simulation — {inv.assetName}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
        Compound Interest Model: FV = PV × (1 + r)^t
      </p>

      {/* Current snapshot */}
      <div className="grid-3" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Amount Invested', value: `$${inv.amountInvested.toLocaleString()}` },
          { label: 'Current Value',   value: `$${inv.currentValue.toLocaleString()}`,   color: 'var(--accent)' },
          { label: 'Current P&L',     value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct}%)`, color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }
        ].map(c => (
          <div className="card" key={c.label} style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>{c.label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Space Mono', color: c.color || 'var(--text)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Scenario cards */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {Object.entries(scenarios).map(([key, sc]) => (
          <div className="card" key={key} style={{ borderTop: `3px solid ${key === 'conservative' ? 'var(--green)' : key === 'moderate' ? 'var(--accent)' : 'var(--red)'}` }}>
            <p style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: '0.6rem' }}>{key}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Annual Rate: <strong style={{ color: 'var(--text)' }}>{sc.rate}</strong></p>
            <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[['1 Year', sc.simulatedValue1Y], ['3 Years', sc.simulatedValue3Y], ['5 Years', sc.simulatedValue5Y]].map(([yr, val]) => (
                <div key={yr} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{yr}</span>
                  <span style={{ fontFamily: 'Space Mono', color: 'var(--text)' }}>${val.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Projected Growth Chart</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" stroke="var(--muted)" fontSize={12} />
            <YAxis stroke="var(--muted)" fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              formatter={v => [`$${v.toLocaleString()}`, '']}
            />
            <Legend />
            <Line type="monotone" dataKey="conservative" stroke="var(--green)"  strokeWidth={2} dot={{ r: 5 }} name="Conservative (4%)" />
            <Line type="monotone" dataKey="moderate"     stroke="var(--accent)" strokeWidth={2} dot={{ r: 5 }} name="Moderate (8%)" />
            <Line type="monotone" dataKey="aggressive"   stroke="var(--red)"    strokeWidth={2} dot={{ r: 5 }} name="Aggressive (14%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--muted)' }}>
        ⚠️ <strong>Disclaimer:</strong> These projections are based on the compound interest formula and assume a fixed annual return rate. Actual market performance varies. This is a simulation tool, not financial advice.
      </div>
    </div>
  );
};

export default SimulatePage;
