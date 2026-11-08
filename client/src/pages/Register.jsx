import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'patient', name: '', email: '', password: '', phone: '', specialization: '', fee: 500,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      saveSession(data);
      navigate(data.user.role === 'doctor' ? '/settings' : '/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card narrow">
      <h1>Create your account</h1>
      <div className="segmented" role="radiogroup" aria-label="Account type">
        {['patient', 'doctor'].map((r) => (
          <button type="button" key={r} className={form.role === r ? 'on' : ''}
            onClick={() => setForm({ ...form, role: r })}>
            {r === 'patient' ? "I'm a patient" : "I'm a doctor"}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <label>Full name<input required value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Password<input type="password" minLength={6} required value={form.password} onChange={set('password')} /></label>
        <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
        {form.role === 'doctor' && (
          <>
            <label>Specialization<input placeholder="e.g. Cardiologist" value={form.specialization} onChange={set('specialization')} /></label>
            <label>Consultation fee (₹)<input type="number" min="0" value={form.fee} onChange={set('fee')} /></label>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}
