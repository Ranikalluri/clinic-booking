import { useState } from 'react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../AuthContext';
import { DAYS } from '../lib/format';

export default function DoctorSettings() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ ...user.profile });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleDay = (n) =>
    setForm({
      ...form,
      workingDays: form.workingDays.includes(n) ? form.workingDays.filter((d) => d !== n) : [...form.workingDays, n].sort(),
    });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await api.put('/doctors/me/profile', form);
      setUser(data.user);
      setMsg({ type: 'ok', text: 'Working hours saved. Patients see the new times right away.' });
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card narrow">
      <h1>Working hours</h1>
      <form onSubmit={save}>
        <label>Specialization<input required value={form.specialization} onChange={set('specialization')} /></label>
        <label>About you<textarea rows={3} maxLength={500} value={form.bio} onChange={set('bio')} /></label>
        <label>Consultation fee (₹)<input type="number" min="0" value={form.fee} onChange={set('fee')} /></label>

        <fieldset>
          <legend>Days you see patients</legend>
          <div className="chips">
            {DAYS.map((d) => (
              <button type="button" key={d.n} className={`chip ${form.workingDays.includes(d.n) ? 'on' : ''}`}
                onClick={() => toggleDay(d.n)} aria-pressed={form.workingDays.includes(d.n)}>
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="two">
          <label>Start<input type="time" required value={form.startTime} onChange={set('startTime')} /></label>
          <label>End<input type="time" required value={form.endTime} onChange={set('endTime')} /></label>
          <label>Break from<input type="time" value={form.breakStart} onChange={set('breakStart')} /></label>
          <label>Break until<input type="time" value={form.breakEnd} onChange={set('breakEnd')} /></label>
        </div>

        <label>Appointment length
          <select value={form.slotMinutes} onChange={(e) => setForm({ ...form, slotMinutes: Number(e.target.value) })}>
            {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </label>

        {msg.text && <p className={msg.type === 'ok' ? 'success' : 'error'}>{msg.text}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
