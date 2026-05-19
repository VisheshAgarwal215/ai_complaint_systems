import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const AiAnalyze = () => {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post(
        '/api/ai/analyze',
        form,
        { timeout: 90000 }
      );
      setResult(data.data);
      toast.success('AI analysis complete');
    } catch (err) {
      const msg =
        err.code === 'ECONNABORTED'
          ? 'AI request timed out — try again'
          : err.response?.data?.message || 'AI analysis failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>✨ AI Complaint Analyzer</h1>
          <p>Get priority, department, summary & auto-response before filing</p>
        </div>
      </header>

      <form className="form-card ai-page" onSubmit={handleAnalyze}>
        <input
          name="title"
          placeholder="Complaint title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Describe the issue in detail..."
          rows={5}
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Category (e.g. Utilities, Infrastructure)"
          value={form.category}
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn ai-btn big" disabled={loading}>
          {loading ? 'Analyzing with AI...' : 'Run AI Analysis'}
        </button>
      </form>

      {loading && (
        <div className="ai-loading">
          <p>Contacting OpenRouter AI — this may take up to 60 seconds...</p>
        </div>
      )}

      {result && (
        <div className="ai-results">
          <h2>AI Triage Results</h2>
          <div className="ai-result-card priority">
            <span className="label">Priority</span>
            <span className={`value priority-${result.priority?.toLowerCase()}`}>
              {result.priority}
            </span>
          </div>
          <div className="ai-result-card">
            <span className="label">Department</span>
            <span className="value">{result.department}</span>
          </div>
          <div className="ai-result-card full">
            <span className="label">Summary</span>
            <p>{result.summary}</p>
          </div>
          <div className="ai-result-card full">
            <span className="label">Suggested Response</span>
            <p>{result.autoResponse}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalyze;
