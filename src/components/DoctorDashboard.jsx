import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, LogOut, FileSearch, ArrowRight, Download, BarChart3, CalendarClock, ShieldCheck, Home } from 'lucide-react';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, last24h: 0, byService: [] });

  useEffect(() => {
    const docUser = JSON.parse(localStorage.getItem('doctorUser') || 'null');
    if (!docUser) {
      navigate('/doctor-login');
      return;
    }
    setDoctor(docUser);
    const all = JSON.parse(localStorage.getItem('patients') || '[]');
    setPatients(all);
    // compute stats
    const now = Date.now();
    const lastDay = all.filter(p => {
      const ts = new Date(p.submittedAt || p.createdAt).getTime();
      return now - ts < 24 * 60 * 60 * 1000;
    }).length;
    const serviceCounts = {};
    all.forEach(p => {
      (p.serviceTypes || []).forEach(s => {
        serviceCounts[s] = (serviceCounts[s] || 0) + 1;
      });
    });
    const byServiceArr = Object.entries(serviceCounts)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 4)
      .map(([name,count]) => ({ name, count }));
    setStats({ total: all.length, last24h: lastDay, byService: byServiceArr });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('doctorUser');
    navigate('/doctor-login');
  };

  const filtered = patients.filter(p => {
    const text = JSON.stringify(p).toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const downloadRecord = (rec) => {
    const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_${rec.patientId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen animated-gradient p-4 pt-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card flex items-center justify-between mb-6 anim-fade-in">
          <div className="flex items-center">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary-100 mr-3 shadow-inner">
              <Stethoscope className="h-7 w-7 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Doctor Dashboard</h1>
              {doctor && <p className="text-gray-600 dark:text-gray-300 text-sm">Welcome, {doctor.name} ({doctor.email})</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="glass-button px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg inline-flex items-center gap-2 dark:text-gray-100">
              <Home className="h-5 w-5" /> Home
            </Link>
            <button onClick={logout} className="glass-button px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg inline-flex items-center gap-2 dark:text-gray-100">
              <LogOut className="h-5 w-5" /> Log Out
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 anim-fade-up">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 anim-fade-up anim-delay-1">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-6 w-6 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Last 24 Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.last24h}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 anim-fade-up anim-delay-2 lg:col-span-2">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Top Service Types</p>
            <div className="flex flex-wrap gap-2">
              {stats.byService.length === 0 ? (
                <span className="text-gray-500 dark:text-gray-400 text-sm">No data</span>
              ) : stats.byService.map(s => (
                <span key={s.name} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-200 dark:bg-primary-900/20 dark:text-primary-300">
                  <ShieldCheck className="h-4 w-4" /> {s.name} <span className="text-xs text-primary-800 dark:text-primary-400">{s.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card mb-6 anim-fade-in">
          <div className="flex items-center gap-3">
            <FileSearch className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <input
              className="input w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              placeholder="Search by patient ID, name, diagnosis, insurance..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="glass-card anim-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Patient Submissions ({filtered.length})</h2>
            <Link to="/patient-form" className="btn-secondary">New Pre-Auth</Link>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-300">No patients found.</p>
              <Link to="/patient-form" className="btn-primary mt-4 inline-flex items-center gap-2">Create your first Pre-Auth <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                    <th className="py-2 pr-4">Patient ID</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Insurance</th>
                    <th className="py-2 pr-4">Diagnosis</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.patientId} className="border-b dark:border-gray-700">
                      <td className="py-2 pr-4 font-medium dark:text-gray-100">{p.patientId}</td>
                      <td className="py-2 pr-4 dark:text-gray-200">{p.personalInfo?.name || '—'}</td>
                      <td className="py-2 pr-4"><span className="px-2 py-1 rounded-md bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{p.healthPlan || '—'}</span></td>
                      <td className="py-2 pr-4"><span className="px-2 py-1 rounded-md bg-medical-50 text-medical-800 dark:bg-medical-900/20 dark:text-medical-300">{p.principalDiagnosisDescription || '—'}</span></td>
                      <td className="py-2 pr-4 dark:text-gray-200">{p.submittedAt || '—'}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <Link to={`/confirmation/${p.patientId}`} className="btn-primary inline-flex items-center gap-1">
                            Review <ArrowRight className="h-4 w-4" />
                          </Link>
                          <button onClick={() => downloadRecord(p)} className="btn-secondary inline-flex items-center gap-1">
                            <Download className="h-4 w-4" /> JSON
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
