import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  email: '',
  title: '',
  description: '',
  category: '',
  location: '',
};

const NewComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...emptyForm,
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const runAiAnalyze = async () => {
    if (!form.title || !form.description || !form.category) {
      toast.error('Fill title, description, and category for AI analysis');
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await api.post('/api/ai/analyze', {
        title: form.title,
        description: form.description,
        category: form.category,
      });
      setAiResult(data.data);
      toast.success('AI analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/complaints', form);
      toast.success('Complaint submitted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>New Complaint</h1>
          <p>File a complaint — use AI Analyze below or from the <Link to="/ai-analyze">AI page</Link></p>
        </div>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="row">
          <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        </div>
        <input name="title" placeholder="Complaint title" value={form.title} onChange={handleChange} required />
        <textarea
          name="description"
          placeholder="Describe the issue..."
          rows={4}
          value={form.description}
          onChange={handleChange}
          required
        />
        <div className="row">
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />
        </div>

        <button type="button" className="btn ai-btn" onClick={runAiAnalyze} disabled={aiLoading}>
          {aiLoading ? 'Analyzing...' : '✨ AI Analyze'}
        </button>

        {aiResult && (
          <div className="ai-box">
            <p>
              <strong>Priority:</strong> {aiResult.priority}
            </p>
            <p>
              <strong>Department:</strong> {aiResult.department}
            </p>
            <p>
              <strong>Summary:</strong> {aiResult.summary}
            </p>
            <p>
              <strong>Suggested reply:</strong> {aiResult.autoResponse}
            </p>
          </div>
        )}

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
};

export default NewComplaint;
