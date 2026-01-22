// AdminPage.js
import React, { useState } from 'react';
import { Container, Tabs, Tab, Alert } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from '../components/admin/UserManagement';
import QueryManagement from '../components/admin/QueryManagement';
import ReportsManagement from '../components/admin/ReportsManagement';

const AdminPage = () => {
  const { currentUser } = useAuth();
  const [key, setKey] = useState('users');

  // Redirects if not logged in or not admin
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!currentUser.isAdmin) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          Bạn không có quyền truy cập trang này.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1 className="text-center mb-4">Bảng quản trị</h1>
      
      <Tabs
        id="admin-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-4"
      >
        <Tab eventKey="users" title="Người dùng">
          <UserManagement />
        </Tab>
        <Tab eventKey="queries" title="Truy vấn">
          <QueryManagement />
        </Tab>
        <Tab eventKey="reports" title="Truy vấn bị báo cáo">
          <ReportsManagement />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminPage;