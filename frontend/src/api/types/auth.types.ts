export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
    createdAt: string;
};

export interface RegisterInput {
    name: string;
    email: string;
    password: string
};

export interface LoginInput {
    email: string;
    password: string;
};

export interface RegisterResponse {
    success: boolean;
    data: {
        user: AuthUser;
    }
};

export interface LoginResponse {
    success: boolean;
    accessToken: string;
    data: {
        user: AuthUser;
    }
};

export interface RefreshResponse {
    accessToken: string;
};

export interface UserResponse {
    data: {
        user: AuthUser;
    }
};

export interface LogoutResponse {
    message: string;
}