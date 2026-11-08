import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../AuthContext';
import { formatDateTime } from '../lib/format';

export default function Appointments() {
  const { user } = useAuth();
  const isDoctor = user.role === 'doctor';
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/bookings/mine').then((r) => setBookings(r.data.bookings)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setError('');
    if (action === 'cancel' && !window.confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/bookings/${id}/${action}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const now = Date.now();
  const upcoming = (bookings || []).filter((b) => b.status === 'booked' && new Date(b.end) > now).reverse();
  const past = (bookings || []).filter((b) => !upcoming.includes(b));

  const Row = ({ b }) => (
    <li className="row">
      <div>
        <strong>{formatDateTime(b.start)}</strong>
        <div>{isDoctor ? b.patient.name : `Dr. ${b.doctor.name} · ${b.doctor.profile?.specialization ?? ''}`}</div>
        {isDoctor && <div className="muted small-text">{b.patient.email} {b.patient.phone && `· ${b.patient.phone}`}</div>}
        {b.reason && <div className="muted small-text">“{b.reason}”</div>}
      </div>
      <div className="actions">
        <span className={`badge ${b.status}`}>{b.status}</span>
        {b.status === 'booked' && isDoctor && <button className="btn small" onClick={() => act(b._id, 'complete')}>Mark done</button>}
        {b.status === 'booked' && new Date(b.end) > now && <button className="btn small ghost" onClick={() => act(b._id, 'cancel')}>Cancel</button>}
      </div>
    </li>
  );

  return (
    <>
      <h1>{isDoctor ? 'Your schedule' : 'My appointments'}</h1>
      {error && <p className="error">{error}</p>}
      {!bookings && <p className="muted">Loading…</p>}

      {bookings && (
        <>
          <h2>Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="muted">
              Nothing booked yet. {!isDoctor && <Link to="/">Find a doctor</Link>}
            </p>
          ) : (
            <ul className="list">{upcoming.map((b) => <Row key={b._id} b={b} />)}</ul>
          )}
          {past.length > 0 && (
            <>
              <h2>History</h2>
              <ul className="list">{past.map((b) => <Row key={b._id} b={b} />)}</ul>
            </>
          )}
        </>
      )}
    </>
  );
}
