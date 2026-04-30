import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '', riskProfile: 'moderate' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.riskProfile);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Space Mono', color: 'var(--accent)', fontSize: '2rem' }}>InvestSim</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Create your portfolio account</p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Create Account</h2>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', color: 'var(--red)', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handle} required placeholder="Ali Hassan" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} required minLength={6} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label>Risk Profile</label>
              <select name="riskProfile" value={form.riskProfile} onChange={handle}>
                <option value="conservative">Conservative — Safety first</option>
                <option value="moderate">Moderate — Balanced growth</option>
                <option value="aggressive">Aggressive — Maximum returns</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.2rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
