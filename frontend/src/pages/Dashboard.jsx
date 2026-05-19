import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/complaints');
      setComplaints(data.data.complaints || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchComplaints();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/complaints/search?location=${encodeURIComponent(search)}`
      );
      setComplaints(data.data.complaints || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Complaints</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/ai-analyze" className="btn ai-btn">
            ✨ AI Analyze
          </Link>
          <Link to="/complaints/new" className="btn primary">
            + New Complaint
          </Link>
        </div>
      </header>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
        <button type="button" onClick={fetchComplaints}>
          Reset
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : complaints.length === 0 ? (
        <p className="muted">No complaints found.</p>
      ) : (
        <div className="grid">
          {complaints.map((c) => (
            <article key={c._id} className="card">
              <div className="card-top">
                <h3>{c.title}</h3>
                <span className={`badge ${c.status?.replace(/\s/g, '-').toLowerCase()}`}>
                  {c.status}
                </span>
              </div>
              <p className="desc">{c.description}</p>
              <div className="meta">
                <span>{c.category}</span>
                <span>{c.location}</span>
              </div>
              <p className="email">
                {c.name} · {c.email}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
