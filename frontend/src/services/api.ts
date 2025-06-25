
const API_BASE_URL = 'http://localhost:8000/api';

interface User {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface EmailAttachment {
  filename: string;
  content_type: string;
  size: number;
}

interface EmailItem {
  id: string;
  sender: string;
  subject: string;
  timestamp: string;
  attachments: EmailAttachment[];
  has_attachments: boolean;
}

interface UserProfile {
  email: string;
  created_at: string;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `bearer ${token}` } : {};
  }

  async register(email: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Y210MWNtVnNiR2xtTldRNU9HWTNaUzFsTURsbUxUUmpaRGN0T1dJM1pDMHlZelptTkRNeVpHRXdaVFE9'
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  async getEmails(): Promise<EmailItem[]> {
    const response = await fetch(`${API_BASE_URL}/emails`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch emails');
    }

    return response.json();
  }

  async downloadAttachment(emailId: string, filename: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/emails/${emailId}/attachments/${filename}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to download attachment');
    }

    return response.blob();
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch profile');
    }

    return response.json();
  }

  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    localStorage.removeItem('access_token');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Logout failed');
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
}

export const apiService = new ApiService();
export type { EmailItem, EmailAttachment, UserProfile };
