'use client';

import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTime, setUploadTime] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setDocuments([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (data.success) {
        setAnswer(data.answer);
        setDocuments(data.documents);
        setSearchHistory([question, ...searchHistory.slice(0, 4)]);
      } else {
        setAnswer(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setAnswer(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadProgress(0);
    setUploadStatus('Reading file...');
    setUploadTime(null);

    const startTime = Date.now();

    try {
      const fileContent = await file.text();
      const expenseData = JSON.parse(fileContent);
      const totalRecords = expenseData.length;
      
      setUploadStatus(`Total ${totalRecords} records found. Beginning batch upload...`);

      // CLIENT-SIDE CHUNKING (Advanced Scaling)
      const CLIENT_BATCH_SIZE = 1000;
      let totalProcessed = 0;
      let totalFailed = 0;

      for (let i = 0; i < totalRecords; i += CLIENT_BATCH_SIZE) {
        const batch = expenseData.slice(i, i + CLIENT_BATCH_SIZE);
        const progressPercent = Math.round((i / totalRecords) * 100);
        
        setUploadStatus(`Processing batch ${Math.floor(i / CLIENT_BATCH_SIZE) + 1}... (${totalProcessed}/${totalRecords})`);
        setUploadProgress(progressPercent);

        const response = await fetch('/api/process-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });

        const data = await response.json();
        
        if (data.success) {
          totalProcessed += data.processed;
          totalFailed += data.failed;
        } else {
          console.error('Batch failed:', data.error);
          totalFailed += batch.length;
        }
      }

      setUploadStatus(
        `✅ Success! Processed ${totalProcessed}/${totalRecords} expenses. 
         ${totalFailed > 0 ? `(${totalFailed} failed)` : ''}`
      );
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      setUploadTime(`${duration}s`);
      setUploadProgress(100);

    } catch (error) {
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const exampleQuestions = [
    'How much did I spend on food?',
    'What was my largest expense?',
    'Show me all education expenses',
    'How much did Yash Jain spend?',
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#667eea', margin: '0 0 10px 0', fontSize: '28px' }}>
            💰 Expense RAG Assistant
          </h1>
          <p style={{ color: '#666', margin: '0' }}>
            Upload expenses and ask questions using AI-powered search
          </p>
        </div>

        {/* Upload Section */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #667eea',
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📤 Upload Expense Data</h3>
          <label style={{
            display: 'block',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: uploadLoading ? 'not-allowed' : 'pointer',
            opacity: uploadLoading ? 0.6 : 1,
          }}>
            <input
              type="file"
              accept=".json"
              onChange={handleUpload}
              disabled={uploadLoading}
              style={{ display: 'none' }}
            />
            <span style={{ color: '#667eea', fontWeight: '500' }}>
              {uploadLoading ? '🚀 Uploading & Indexing...' : '📁 Click to upload JSON file'}
            </span>
          </label>
          
          {uploadLoading && (
            <div style={{
              width: '100%',
              height: '10px',
              backgroundColor: '#eee',
              borderRadius: '5px',
              marginTop: '15px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#667eea',
                animation: 'progress 2s infinite linear'
              }}></div>
            </div>
          )}

          {uploadStatus && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: uploadStatus.includes('✅') ? '#d4edda' : '#f8d7da',
              borderRadius: '4px',
              color: uploadStatus.includes('✅') ? '#155724' : '#721c24',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{uploadStatus}</span>
              {uploadTime && <span style={{ fontSize: '12px', opacity: 0.8 }}>⏱️ {uploadTime}</span>}
            </div>
          )}
          
          <style jsx>{`
            @keyframes progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>

        {/* Search Section */}
        <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Ask about your expenses... e.g., 'How much did I spend on food?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                outline: 'none',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !question.trim() ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!loading && question.trim()) e.target.style.backgroundColor = '#5568d3';
              }}
              onMouseLeave={(e) => {
                if (!loading && question.trim()) e.target.style.backgroundColor = '#667eea';
              }}
            >
              {loading ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>
        </form>

        {/* Quick Examples */}
        {searchHistory.length === 0 && !answer && (
          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>Try asking:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {exampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    setTimeout(() => {
                      document.querySelector('button[type="submit"]').click();
                    }, 100);
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#333',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e8e8e8';
                    e.target.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answer Section */}
        {answer && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#e7f3ff',
            borderLeft: '4px solid #667eea',
            borderRadius: '6px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#667eea' }}>🤖 Answer</h3>
            <p style={{ margin: '0', color: '#333', lineHeight: '1.6' }}>
              {answer}
            </p>
          </div>
        )}

        {/* Source Documents */}
        {documents.length > 0 && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
              📋 Source Documents ({documents.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {documents.map((doc, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderLeft: '4px solid #667eea',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#333' }}>
                    {doc.content || doc.description}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666' }}>
                    <span>💰 ₹{doc.amount}</span>
                    <span>🏷️ {doc.category}</span>
                    <span>👤 {doc.member || 'N/A'}</span>
                    <span>📅 {doc.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      
      {/* Footer / Clear Data */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={async () => {
            if (confirm('Are you sure you want to clear all uploaded expenses?')) {
              await fetch('/api/process-data', { method: 'DELETE' });
              setUploadStatus('🗑️ All data cleared.');
              setAnswer(null);
              setDocuments([]);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'underline'
          }}
        >
          Clear all uploaded data
        </button>
      </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #e0e0e0',
          }}>
            <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>Recent searches:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {searchHistory.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#333',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#667eea';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.color = '#333';
                  }}
                >
                  {q.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
