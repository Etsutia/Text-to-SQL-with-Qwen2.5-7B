import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkApiStatus } from '../services/apiService';

const AppNavbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState({ connected: false, message: '' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkApiStatus();
        setApiStatus({
          connected: result.status === 'ok',
          message: result.status === 'ok' ? 'LM Studio API: Đã kết nối' : 'LM Studio API: Mất kết nối'
        });
      } catch (error) {
        setApiStatus({ connected: false, message: 'LM Studio API: Mất kết nối' });
      }
    };

    checkStatus();
    // Kiểm tra trạng thái mỗi 30 giây
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">Text to DQL</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
              {currentUser && (
                <Nav.Link as={Link} to="/profile">Hồ sơ</Nav.Link>
              )}
              {currentUser && currentUser.isAdmin && (
                <Nav.Link as={Link} to="/admin">Quản trị</Nav.Link>
              )}
            </Nav>
            <Nav>
              {currentUser ? (
                <>
                  <Nav.Link>Xin chào, {currentUser.username}</Nav.Link>
                  <Nav.Link onClick={handleLogout}>Đăng xuất</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">Đăng nhập</Nav.Link>
                  <Nav.Link as={Link} to="/register">Đăng ký</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div 
        className={`api-status ${apiStatus.connected ? 'connected' : 'disconnected'}`}
        style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          color: 'white',
          backgroundColor: apiStatus.connected ? '#198754' : '#dc3545',
          display: 'block',
          zIndex: 1000
        }}
      >
        {apiStatus.message}
      </div>
    </>
  );
};

export default AppNavbar;