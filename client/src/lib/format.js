// The clinic works in one time zone; every time shown to users uses it.
export const CLINIC_TZ = import.meta.env.VITE_CLINIC_TZ || 'Asia/Kolkata';

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: CLINIC_TZ });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: CLINIC_TZ,
  });

// 'YYYY-MM-DD' for today in the clinic's time zone
export const todayInClinic = () => new Date().toLocaleDateString('en-CA', { timeZone: CLINIC_TZ });

export const DAYS = [
  { n: 1, label: 'Mon' }, { n: 2, label: 'Tue' }, { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' }, { n: 5, label: 'Fri' }, { n: 6, label: 'Sat' }, { n: 7, label: 'Sun' },
];
