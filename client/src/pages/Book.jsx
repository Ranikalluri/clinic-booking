import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { CLINIC_TZ, formatDateTime, formatTime, todayInClinic } from '../lib/format';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(todayInClinic());
  const [slots, setSlots] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${id}`).then((r) => setDoctor(r.data.doctor)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const loadSlots = () => {
    setSlots(null);
    api.get(`/doctors/${id}/slots`, { params: { date } })
      .then((r) => setSlots(r.data.slots))
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(() => { setSelected(null); loadSlots(); }, [id, date]); // eslint-disable-line

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/bookings', { doctorId: id, start: selected.start, reason });
      navigate('/appointments');
    } catch (err) {
      setError(errorMessage(err));
      setSelected(null);
      loadSlots(); // refresh so the taken slot shows as unavailable
    } finally {
      setBusy(false);
    }
  };

  if (!doctor) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  return (
    <>
      <Link to="/" className="back">← All doctors</Link>
      <h1>Book Dr. {doctor.name}</h1>
      <p className="muted">{doctor.profile.specialization} · ₹{doctor.profile.fee} per visit</p>

      <div className="split">
        <section className="card">
          <label>Choose a date
            <input type="date" value={date} min={todayInClinic()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <p className="muted small-text">All times are in {CLINIC_TZ}.</p>

          {!slots && <p className="muted">Loading times…</p>}
          {slots && slots.length === 0 && (
            <p className="muted">No times left on this date. Try another day.</p>
          )}
          <div className="slots">
            {slots?.map((s) => (
              <button key={s.start} type="button" disabled={!s.available}
                className={`slot ${selected?.start === s.start ? 'on' : ''}`}
                onClick={() => setSelected(s)}>
                {formatTime(s.start)}
              </button>
            ))}
          </div>
        </section>

        <aside className="card">
          <h2>Your visit</h2>
          {selected ? <p className="chosen">{formatDateTime(selected.start)}</p> : <p className="muted">Pick a time to continue.</p>}
          <label>Reason for visit (optional)
            <textarea rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={!selected || busy} onClick={confirm}>
            {busy ? 'Booking…' : 'Confirm appointment'}
          </button>
          <p className="muted small-text">Free cancellation up to 2 hours before. Pay at the clinic.</p>
        </aside>
      </div>
    </>
  );
}
