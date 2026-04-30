import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { investmentAPI } from '../utils/api';

const ASSET_TYPES = ['stock', 'crypto', 'bond', 'mutual_fund', 'etf'];
const RISK_LEVELS = ['low', 'medium', 'high'];

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [filter, setFilter]           = useState({ assetType: '', riskLevel: '', sort: '' });
  const [form, setForm]               = useState({
    assetName: '', assetType: 'stock', quantity: '',
    purchasePrice: '', currentPrice: '', expectedReturnRate: '8', riskLevel: 'medium'
  });
  const [updating, setUpdating]   = useState(null); // investment id being price-updated
  const [newPrice, setNewPrice]   = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await investmentAPI.getAll(filter);
      setInvestments(res.data.investments);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleForm = e => setForm({ ...form, [e.target.name]: e.target.value });

  const addInvestment = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await investmentAPI.add({
        ...form,
        quantity: parseFloat(form.quantity),
        purchasePrice: parseFloat(form.purchasePrice),
        currentPrice: parseFloat(form.currentPrice),
        expectedReturnRate: parseFloat(form.expectedReturnRate)
      });
      setForm({ assetName: '', assetType: 'stock', quantity: '', purchasePrice: '', currentPrice: '', expectedReturnRate: '8', riskLevel: 'medium' });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add investment');
    } finally {
      setSubmitting(false);
    }
  };

  const updatePrice = async (id) => {
    if (!newPrice) return;
    try {
      await investmentAPI.update(id, { currentPrice: parseFloat(newPrice) });
      setUpdating(null);
      setNewPrice('');
      load();
    } catch {}
  };

  const sellInvestment = async (id) => {
    if (!window.confirm('Mark this investment as sold?')) return;
    try {
      await investmentAPI.remove(id);
      load();
    } catch {}
  };

  const pnlColor = (inv) => {
    const ret = inv.currentValue - inv.amountInvested;
    return ret >= 0 ? 'var(--green)' : 'var(--red)';
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>💹 My Investments</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Investment'}
        </button>
      </div>

      {/* Add Investment Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Investment</h3>
          {formError && <div style={{ color: 'var(--red)', marginBottom: '1rem', fontSize: '0.9rem' }}>{formError}</div>}
          <form onSubmit={addInvestment}>
            <div className="grid-2">
              <div className="form-group">
                <label>Asset Name</label>
                <input name="assetName" value={form.assetName} onChange={handleForm} required placeholder="e.g. Apple Inc, Bitcoin" />
              </div>
              <div className="form-group">
                <label>Asset Type</label>
                <select name="assetType" value={form.assetType} onChange={handleForm}>
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity (units)</label>
                <input name="quantity" type="number" step="any" min="0.0001" value={form.quantity} onChange={handleForm} required placeholder="e.g. 10" />
              </div>
              <div className="form-group">
                <label>Purchase Price ($)</label>
                <input name="purchasePrice" type="number" step="any" min="0.01" value={form.purchasePrice} onChange={handleForm} required placeholder="e.g. 150.00" />
              </div>
              <div className="form-group">
                <label>Current Price ($)</label>
                <input name="currentPrice" type="number" step="any" min="0.01" value={form.currentPrice} onChange={handleForm} required placeholder="e.g. 160.00" />
              </div>
              <div className="form-group">
                <label>Expected Annual Return (%)</label>
                <input name="expectedReturnRate" type="number" step="any" value={form.expectedReturnRate} onChange={handleForm} placeholder="e.g. 8" />
              </div>
              <div className="form-group">
                <label>Risk Level</label>
                <select name="riskLevel" value={form.riskLevel} onChange={handleForm}>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : '+ Add Investment'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Asset Type</label>
          <select value={filter.assetType} onChange={e => setFilter({ ...filter, assetType: e.target.value })}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text)', fontFamily: 'inherit' }}>
            <option value="">All Types</option>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Risk Level</label>
          <select value={filter.riskLevel} onChange={e => setFilter({ ...filter, riskLevel: e.target.value })}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text)', fontFamily: 'inherit' }}>
            <option value="">All Risks</option>
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Sort By</label>
          <select value={filter.sort} onChange={e => setFilter({ ...filter, sort: e.target.value })}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text)', fontFamily: 'inherit' }}>
            <option value="">Newest</option>
            <option value="return_desc">Highest Value</option>
            <option value="return_asc">Lowest Value</option>
          </select>
        </div>
        <button className="btn btn-ghost" onClick={() => setFilter({ assetType: '', riskLevel: '', sort: '' })}>Clear</button>
      </div>

      {/* Investment Table */}
      {loading ? <div className="spinner" /> : (
        <div className="card">
          {investments.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
              No investments yet. Add one above to get started!
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                    {['Asset', 'Type', 'Qty', 'Purchase $', 'Current $', 'Invested', 'Value', 'P&L', 'Risk', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.5rem', textAlign: h === 'Actions' ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => {
                    const pnl = inv.currentValue - inv.amountInvested;
                    const pnlPct = ((pnl / inv.amountInvested) * 100).toFixed(1);
                    return (
                      <tr key={inv._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.7rem 0.5rem', fontWeight: 600 }}>{inv.assetName}</td>
                        <td><span className="badge badge-blue">{inv.assetType.replace('_', ' ')}</span></td>
                        <td>{inv.quantity}</td>
                        <td>${inv.purchasePrice.toLocaleString()}</td>
                        <td>
                          {updating === inv._id ? (
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" style={{ width: 80, padding: '0.2rem 0.4rem', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--text)', fontSize: '0.8rem' }} />
                              <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => updatePrice(inv._id)}>✓</button>
                              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setUpdating(null)}>✕</button>
                            </div>
                          ) : (
                            <span onClick={() => { setUpdating(inv._id); setNewPrice(inv.currentPrice); }} style={{ cursor: 'pointer', textDecoration: 'underline dotted', color: 'var(--accent)' }}>
                              ${inv.currentPrice.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td>${inv.amountInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td>${inv.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ color: pnlColor(inv), fontWeight: 600 }}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)} ({pnlPct}%)
                        </td>
                        <td>
                          <span className={`badge ${inv.riskLevel === 'high' ? 'badge-red' : inv.riskLevel === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                            {inv.riskLevel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Link to={`/simulate/${inv._id}`} className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginRight: '0.3rem' }}>📈 Sim</Link>
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => sellInvestment(inv._id)}>Sell</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestmentsPage;
