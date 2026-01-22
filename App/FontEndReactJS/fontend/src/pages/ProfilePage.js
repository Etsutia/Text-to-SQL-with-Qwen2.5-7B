import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Table, Alert, Spinner, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getUserProfile, deleteUserQuery, reportQuery, checkReportStatus } from '../services/apiService';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // State cho Modal xóa truy vấn
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);
  
  // State cho Modal báo cáo truy vấn
  const [showReportModal, setShowReportModal] = useState(false);
  const [queryToReport, setQueryToReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportStatuses, setReportStatuses] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Khi lấy được dữ liệu profile, kiểm tra trạng thái báo cáo của từng truy vấn
    if (profileData && profileData.queries) {
      profileData.queries.forEach(query => {
        fetchReportStatus(query.id);
      });
    }
  }, [profileData]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfileData(data);
      setError('');
    } catch (err) {
      setError(err.error || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportStatus = async (queryId) => {
    try {
      const result = await checkReportStatus(queryId);
      setReportStatuses(prev => ({
        ...prev,
        [queryId]: result
      }));
    } catch (err) {
      console.error(`Lỗi khi kiểm tra trạng thái báo cáo cho truy vấn ${queryId}:`, err);
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
      setLoading(true);
      await deleteUserQuery(queryToDelete.id);
      
      // Cập nhật state để hiển thị danh sách mới (không bao gồm truy vấn đã xóa)
      setProfileData({
        ...profileData,
        queries: profileData.queries.filter(q => q.id !== queryToDelete.id)
      });
      
      setShowDeleteModal(false);
      setQueryToDelete(null);
      setMessage('Xóa truy vấn thành công');
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi xóa truy vấn');
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở modal báo cáo
  const handleReportClick = (query) => {
    setQueryToReport(query);
    setReportReason('');
    setShowReportModal(true);
  };

  // Hàm báo cáo truy vấn
  const handleReportConfirm = async () => {
    if (!queryToReport) return;
    
    try {
      setLoading(true);
      await reportQuery(queryToReport.id, reportReason);
      
      // Cập nhật trạng thái báo cáo
      setReportStatuses(prev => ({
        ...prev,
        [queryToReport.id]: { 
          is_reported: true, 
          status: 'pending',
          created_at: new Date().toISOString()
        }
      }));
      
      setShowReportModal(false);
      setQueryToReport(null);
      setMessage('Báo cáo truy vấn thành công');
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi báo cáo truy vấn');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị trạng thái báo cáo
  const renderReportStatus = (queryId) => {
    const status = reportStatuses[queryId];
    
    if (!status || !status.is_reported) {
      return (
        <Button 
          variant="warning" 
          size="sm"
          onClick={() => handleReportClick({ id: queryId })}
        >
          Báo cáo
        </Button>
      );
    }
    
    // Nếu đã báo cáo, hiển thị trạng thái
    let badgeVariant = 'secondary';
    let statusText = 'Đã báo cáo';
    
    if (status.status === 'pending') {
      badgeVariant = 'warning';
      statusText = 'Đang chờ xử lý';
    } else if (status.status === 'reviewed') {
      badgeVariant = 'success';
      statusText = 'Đã xem xét';
    } else if (status.status === 'ignored') {
      badgeVariant = 'danger';
      statusText = 'Đã bỏ qua';
    }
    
    return <Badge bg={badgeVariant}>{statusText}</Badge>;
  };

  if (loading && !profileData) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Không tìm thấy thông tin người dùng.</Alert>
      </Container>
    );
  }

  const { user, queries } = profileData;

  return (
    <Container fluid className="my-4">
      <h1 className="text-center mb-4">Hồ sơ người dùng</h1>
      
      {message && (
        <Alert variant="success" onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Thông tin tài khoản</Card.Title>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Tên đăng nhập:</strong> {user.username}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Email:</strong> {user.email}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Ngày tạo:</strong> {new Date(user.created_at).toLocaleString('vi-VN')}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Vai trò:</strong> {user.is_admin ? 'Quản trị viên' : 'Người dùng'}
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Lịch sử truy vấn</Card.Title>
          
          {queries && queries.length > 0 ? (
            <div className="table-responsive">
              <Table striped hover className="w-100">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Câu hỏi</th>
                    <th style={{ width: '25%' }}>SQL</th>
                    <th style={{ width: '25%' }}>Schema</th>
                    <th style={{ width: '10%' }}>Ngày tạo</th>
                    <th style={{ width: '12%' }}>Trạng thái</th>
                    <th style={{ width: '13%' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((query) => (
                    <tr key={query.id}>
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
                      <td style={{ textAlign: 'center' }}>
                        {renderReportStatus(query.id)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
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
          ) : (
            <Alert variant="info">Bạn chưa có truy vấn nào.</Alert>
          )}
        </Card.Body>
      </Card>

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

      {/* Modal báo cáo truy vấn */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Báo cáo truy vấn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Vui lòng cung cấp lý do bạn nghĩ rằng kết quả truy vấn này không chính xác:</p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Lý do báo cáo..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Hủy
          </Button>
          <Button variant="warning" onClick={handleReportConfirm}>
            Báo cáo
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProfilePage;