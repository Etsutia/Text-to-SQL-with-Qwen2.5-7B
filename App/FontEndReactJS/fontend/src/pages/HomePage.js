import React, { useState } from 'react';
import { Container, Form, Button, Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import { generateSQL } from '../services/apiService';
import QueryHistorySidebar from '../components/QueryHistorySidebar';

const HomePage = () => {
  const { currentUser } = useAuth();
  const [question, setQuestion] = useState('');
  const [schema, setSchema] = useState('');
  const [useSchema, setUseSchema] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sqlResult, setSqlResult] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const handleGenerateSQL = async () => {
    if (!question) {
      setError('Vui lòng nhập câu hỏi');
      return;
    }

    setError('');
    setLoading(true);
    setSqlResult('');

    try {
      const result = await generateSQL(question, useSchema ? schema : '');
      setSqlResult(result.sql);
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi tạo SQL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlResult)
      .then(() => {
        setCopySuccess('Đã sao chép!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Lỗi khi sao chép: ', err);
      });
  };

  const handleSelectQuery = (query) => {
    setQuestion(query.question);
    if (query.DBSchema) {
      setSchema(query.DBSchema);
      setUseSchema(true);
    } else {
      setUseSchema(false);
    }
  };

  if (!currentUser) {
    return (
      <Container className="my-4">
        <Card>
          <Card.Body>
            <Card.Title as="h1" className="text-center">Chuyển đổi Ngôn ngữ tự nhiên sang DQL</Card.Title>
            <Alert variant="info">
              Vui lòng <Alert.Link href="/login">đăng nhập</Alert.Link> hoặc <Alert.Link href="/register">đăng ký</Alert.Link> để sử dụng dịch vụ.
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="h-100">
        {/* Thanh bên hiển thị lịch sử câu hỏi */}
        <Col md={3} lg={2} className="p-0 sidebar-container" style={{ height: 'calc(100vh - 120px)' }}>
          <QueryHistorySidebar onSelectQuery={handleSelectQuery} />
        </Col>
        
        {/* Khu vực chính */}
        <Col md={9} lg={10}>
          <Card>
            <Card.Body>
              <Card.Title as="h1" className="text-center mb-4">Chuyển đổi Ngôn ngữ tự nhiên sang DQL</Card.Title>
              
              {error && <Alert variant="danger">{error}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label><strong>Câu hỏi:</strong></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="useSchema"
                  label="Thêm thông tin Schema"
                  checked={useSchema}
                  onChange={(e) => setUseSchema(e.target.checked)}
                />
              </Form.Group>

              {useSchema && (
                <Form.Group className="mb-3">
                  <Form.Label><strong>Schema của cơ sở dữ liệu:</strong></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={schema}
                    onChange={(e) => setSchema(e.target.value)}
                    placeholder="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, ...)"
                  />
                </Form.Group>
              )}

              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleGenerateSQL} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                      Đang xử lý...
                    </>
                  ) : 'Tạo SQL'}
                </Button>
              </div>

              {sqlResult && (
                <Card className="mt-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Câu lệnh DQL:</h5>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleCopySQL}
                        style={{ backgroundColor: copySuccess ? '#198754' : '#6c757d' }}
                      >
                        {copySuccess || 'Sao chép'}
                      </Button>
                    </div>
                    <SyntaxHighlighter language="sql" style={vscDarkPlus}>
                      {sqlResult}
                    </SyntaxHighlighter>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;