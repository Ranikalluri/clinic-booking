import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../AuthContext';

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/doctors').then((r) => setDoctors(r.data.doctors)).catch((e) => setError(errorMessage(e)));
  }, []);

  const shown = (doctors || []).filter((d) =>
    `${d.name} ${d.profile?.specialization}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <section className="hero">
        <h1>See a doctor this week, not next month.</h1>
        <p>Pick a doctor, choose a time that suits you, and get a confirmation email straight away.</p>
        <input className="search" placeholder="Search by name or specialty" value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label="Search doctors" />
      </section>

      {error && <p className="error">{error}</p>}
      {!doctors && !error && <p className="muted">Loading doctors…</p>}
      {doctors && shown.length === 0 && <p className="muted">No doctors match “{query}”. Try a different word.</p>}

      <div className="grid">
        {shown.map((d) => (
          <article className="card doctor" key={d._id}>
            <div className="avatar" aria-hidden>{d.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
            <h2>Dr. {d.name}</h2>
            <p className="spec">{d.profile.specialization}</p>
            {d.profile.bio && <p className="muted">{d.profile.bio}</p>}
            <p className="fee">₹{d.profile.fee} per visit · {d.profile.slotMinutes} min slots</p>
            {user?.role === 'patient' ? (
              <Link className="btn" to={`/doctors/${d._id}`}>Book a time</Link>
            ) : !user ? (
              <Link className="btn ghost" to="/login">Log in to book</Link>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
