import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Cấu hình axios
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// API SQL Generation
export const generateSQL = async (question, schema = '') => {
  try {
    const response = await axios.post(`${API_URL}/api/generate`, {
      question,
      schema
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API Kiểm tra trạng thái LM Studio
export const checkApiStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    return { status: 'error', message: 'Không thể kết nối đến server' };
  }
};

// API lấy thông tin profile
export const getUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/user/profile`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API admin lấy danh sách users
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/users`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API admin cập nhật user
export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_URL}/api/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API admin xóa user
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API admin lấy danh sách queries
export const getQueries = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/queries`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API xóa truy vấn người dùng
export const deleteUserQuery = async (queryId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/user/queries/${queryId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API admin xóa truy vấn
export const deleteQuery = async (queryId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/admin/queries/${queryId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API báo cáo truy vấn
export const reportQuery = async (queryId, reason) => {
  try {
    const response = await axios.post(`${API_URL}/api/user/queries/${queryId}/report`, { reason });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API kiểm tra trạng thái báo cáo của truy vấn
export const checkReportStatus = async (queryId) => {
  try {
    const response = await axios.get(`${API_URL}/api/user/queries/${queryId}/report-status`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API lấy danh sách báo cáo (cho admin)
export const getReports = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/reports`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API cập nhật trạng thái báo cáo (cho admin)
export const updateReportStatus = async (reportId, data) => {
  try {
    const response = await axios.put(`${API_URL}/api/admin/reports/${reportId}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};

// API lấy các câu hỏi của người dùng hiện tại cho thanh bên
export const getUserQueries = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/user/queries`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: 'Không thể kết nối đến server' };
  }
};