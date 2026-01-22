// UserManagement.js
import React, { useState, useEffect } from 'react';
import { Table, Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { getUsers, updateUser, deleteUser } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.error || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, isAdmin) => {
    try {
      await updateUser(userId, { is_admin: isAdmin });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: isAdmin } : user
      ));
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi cập nhật vai trò');
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.error || 'Có lỗi xảy ra khi xóa người dùng');
    }
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
    <>
      <h3>Quản lý người dùng</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Table responsive striped>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên đăng nhập</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Ngày tạo</th>
            <th>Lượt truy vấn</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <Form.Select
                  size="sm"
                  value={user.is_admin ? "1" : "0"}
                  onChange={(e) => handleRoleChange(user.id, e.target.value === "1")}
                  disabled={user.id === currentUser.id}
                >
                  <option value="0">Người dùng</option>
                  <option value="1">Quản trị viên</option>
                </Form.Select>
              </td>
              <td>{new Date(user.created_at).toLocaleString('vi-VN')}</td>
              <td>{user.query_count}</td>
              <td>
                {user.id !== currentUser.id ? (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDeleteClick(user)}
                  >
                    Xóa
                  </Button>
                ) : (
                  <span className="badge bg-info">Người dùng hiện tại</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal xác nhận xóa */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToDelete && (
            <p>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete.username}</strong>?
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
    </>
  );
};

export default UserManagement;