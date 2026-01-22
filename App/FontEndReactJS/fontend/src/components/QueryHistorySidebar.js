import React, { useState, useEffect } from 'react';
import { ListGroup, Spinner, Alert } from 'react-bootstrap';
import { getUserQueries } from '../services/apiService';
import './QueryHistorySidebar.css';

const QueryHistorySidebar = ({ onSelectQuery }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const data = await getUserQueries();
      setQueries(data);
      setError('');
    } catch (err) {
      setError(err.error || 'Không thể tải danh sách truy vấn');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryClick = (query) => {
    if (onSelectQuery) {
      onSelectQuery(query);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-2 p-2 small">
        {error}
      </Alert>
    );
  }

  return (
    <div className="query-history-sidebar">
      <h6 className="sidebar-header p-2">Lịch sử câu hỏi</h6>
      {queries.length === 0 ? (
        <p className="text-muted text-center small p-3">Chưa có câu hỏi nào.</p>
      ) : (
        <ListGroup variant="flush">
          {queries.map((query) => (
            <ListGroup.Item 
              key={query.id}
              action
              onClick={() => handleQueryClick(query)}
              className="query-item"
            >
              <div className="query-text">{query.question}</div>
              <div className="query-date">{new Date(query.created_at).toLocaleDateString('vi-VN')}</div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default QueryHistorySidebar;