import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, Modal, Form, Badge } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getReports, updateReportStatus } from '../../services/apiService';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // State cho Modal xử lý báo cáo
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [reportToResolve, setReportToResolve] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('reviewed');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getReports();
      setReports(data);
      setError('');
    } catch (err) {
      setError(err.error || 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở modal xử lý báo cáo
  const handleResolveClick = (report) => {
    setReportToResolve(report);
    setSelectedStatus('reviewed');
    setAdminNotes('');
    setShowResolveModal(true);
  };

  // Hàm xử lý báo cáo
  const handleResolveConfirm = async () => {
    if (!reportToResolve) return;
    
    try {
      setLoading(true);
      await updateReportStatus(reportToResolve.id, {
        status: selectedStatus,
        admin_notes: adminNotes
      });
      
      // Cập nhật state để hiển thị danh sách mới
      setReports(reports.map(report => 
        report.id === reportToResolve.id 
          ? { 
              ...report, 
              status: selectedStatus, 
              admin_notes: adminNotes,
              resolved_at: new Date().toISOString()
            } 
          : report
      ));
      
      setShowResolveModal(false);
      setReportToResolve(null);
      setMessage(`Báo cáo đã được ${selectedStatus === 'reviewed' ? 'xem xét' : 'bỏ qua'}`);
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi xử lý báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị trạng thái báo cáo
  const renderReportStatus = (status) => {
    let badgeVariant = 'secondary';
    let statusText = 'Không xác định';
    
    if (status === 'pending') {
      badgeVariant = 'warning';
      statusText = 'Đang chờ xử lý';
    } else if (status === 'reviewed') {
      badgeVariant = 'success';
      statusText = 'Đã xem xét';
    } else if (status === 'ignored') {
      badgeVariant = 'danger';
      statusText = 'Đã bỏ qua';
    }
    
    return <Badge bg={badgeVariant}>{statusText}</Badge>;
  };

  if (loading && reports.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <h3>Quản lý báo cáo</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {message && (
        <Alert variant="success" onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}
      
      {reports.length === 0 ? (
        <Alert variant="info">Chưa có báo cáo nào.</Alert>
      ) : (
        <Table responsive striped>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người báo cáo</th>
              <th>Câu hỏi</th>
              <th>SQL</th>
              <th>Lý do báo cáo</th>
              <th>Ngày báo cáo</th>
              <th>Trạng thái</th>
              <th>Ghi chú Admin</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id} className={report.status === 'pending' ? "table-warning" : ""}>
                <td>{report.id}</td>
                <td>{report.reported_by}</td>
                <td>{report.question}</td>
                <td>
                  <SyntaxHighlighter 
                    language="sql" 
                    style={vscDarkPlus}
                    customStyle={{ maxHeight: '150px' }}
                  >
                    {report.sql_query}
                  </SyntaxHighlighter>
                </td>
                <td>{report.reason || <span className="text-muted">Không có lý do</span>}</td>
                <td>{new Date(report.created_at).toLocaleString('vi-VN')}</td>
                <td>{renderReportStatus(report.status)}</td>
                <td>{report.admin_notes || <span className="text-muted">Không có ghi chú</span>}</td>
                <td>
                  {report.status === 'pending' ? (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleResolveClick(report)}
                    >
                      Xử lý
                    </Button>
                  ) : (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleResolveClick(report)}
                    >
                      Cập nhật
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal xử lý báo cáo */}
      <Modal show={showResolveModal} onHide={() => setShowResolveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xử lý báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reportToResolve && (
            <>
              <p>
                <strong>Người báo cáo:</strong> {reportToResolve.reported_by}
                <br />
                <strong>Câu hỏi:</strong> {reportToResolve.question}
                <br />
                <strong>Lý do báo cáo:</strong> {reportToResolve.reason || 'Không có lý do'}
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>Trạng thái:</Form.Label>
                <Form.Select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="reviewed">Đã xem xét</option>
                  <option value="ignored">Bỏ qua</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Ghi chú của Admin:</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ghi chú không bắt buộc..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleResolveConfirm}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReportsManagement;