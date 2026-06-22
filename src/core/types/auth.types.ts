export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  roles?: string[]; 
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}