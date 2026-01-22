import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Modal, Badge } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getQueries, deleteQuery } from '../../services/apiService';

const QueryManagement = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // State cho Modal xác nhận xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const data = await getQueries();
      setQueries(data);
      setError('');
    } catch (err) {
      setError(err.error || 'Không thể tải danh sách truy vấn');
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở modal xác nhận xóa
  const handleDeleteClick = (query) => {
    setQueryToDelete(query);
    setShowDeleteModal(true);
  };

  // Hàm xóa truy vấn
  const handleDeleteConfirm = async () => {
    if (!queryToDelete) return;
    
    try {
      await deleteQuery(queryToDelete.id);
      setQueries(queries.filter(query => query.id !== queryToDelete.id));
      setShowDeleteModal(false);
      setQueryToDelete(null);
      setMessage('Xóa truy vấn thành công');
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi xóa truy vấn');
    }
  };

  // Hiển thị trạng thái báo cáo
  const renderReportStatus = (query) => {
    if (!query.is_reported) {
      return <Badge bg="success">Bình thường</Badge>;
    }
    return <Badge bg="warning">Đã bị báo cáo</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="query-management">
      <h3>Lịch sử truy vấn</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {message && (
        <Alert variant="success" onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}
      
      {queries.length === 0 ? (
        <Alert variant="info">Chưa có truy vấn nào.</Alert>
      ) : (
        <div className="table-responsive">
          <Table responsive striped hover className="w-100">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>ID</th>
                <th style={{ width: '8%' }}>Người dùng</th>
                <th style={{ width: '15%' }}>Câu hỏi</th>
                <th style={{ width: '22%' }}>SQL</th>
                <th style={{ width: '22%' }}>Schema</th>
                <th style={{ width: '10%' }}>Ngày tạo</th>
                <th style={{ width: '8%' }}>Trạng thái</th>
                <th style={{ width: '10%' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {queries.map(query => (
                <tr key={query.id} className={query.is_reported ? "table-warning" : ""}>
                  <td>{query.id}</td>
                  <td>{query.username}</td>
                  <td>{query.question}</td>
                  <td>
                    <SyntaxHighlighter 
                      language="sql" 
                      style={vscDarkPlus}
                      customStyle={{ 
                        maxHeight: '150px',
                        fontSize: '13px'
                      }}
                    >
                      {query.sql_query}
                    </SyntaxHighlighter>
                  </td>
                  <td>
                    {query.DBSchema ? (
                      <SyntaxHighlighter 
                        language="sql" 
                        style={vscDarkPlus}
                        customStyle={{ 
                          maxHeight: '150px',
                          fontSize: '13px'
                        }}
                      >
                        {query.DBSchema}
                      </SyntaxHighlighter>
                    ) : (
                      <span className="text-muted">Không có schema</span>
                    )}
                  </td>
                  <td>{new Date(query.created_at).toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center' }}> {/* Căn giữa nội dung */}
                    {renderReportStatus(query)}
                  </td>
                  <td style={{ textAlign: 'center' }}> {/* Căn giữa nút */}
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteClick(query)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {queryToDelete && (
            <p>
              Bạn có chắc chắn muốn xóa truy vấn này không?
              <br />
              <strong>ID:</strong> {queryToDelete.id}
              <br />
              <strong>Người dùng:</strong> {queryToDelete.username}
              <br />
              <strong>Câu hỏi:</strong> {queryToDelete.question}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QueryManagement;