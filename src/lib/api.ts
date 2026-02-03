// API Client for CablePay Backend
const getApiUrl = () => {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    const fallbackUrl = 'http://localhost:3001/api';

    const finalUrl = envUrl || fallbackUrl;

    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
        console.log('[API Client] Environment VITE_API_URL:', envUrl);
        console.log('[API Client] Using API URL:', finalUrl);
    }

    return finalUrl;
};

const API_URL = getApiUrl();

class ApiClient {
    private baseURL: string;

    constructor() {
        this.baseURL = API_URL;

        // Log initialization (only in development)
        if (import.meta.env.DEV) {
            console.log('[API Client] Initialized with baseURL:', this.baseURL);
        }
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setToken(token: string) {
        localStorage.setItem('token', token);
    }

    removeToken() {
        localStorage.removeItem('token');
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        // Ensure endpoint starts with /
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseURL}${path}`;

        try {
            if (import.meta.env.DEV) {
                console.log(`[API] ${config.method || 'GET'} ${url}`);
            }

            const response = await fetch(url, config);

            if (!response.ok) {
                let errorMessage = `Request failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    const details = errorData.error || errorData.message;
                    if (details) {
                        errorMessage = `${details} (${response.status})`;
                    }
                } catch (e) {
                    // Not a JSON error response
                }

                // Handle 401 Unauthorized - token is invalid or expired
                if (response.status === 401) {
                    console.error(`[API Error] 401 Unauthorized - Token is invalid or expired`);
                    console.error(`[API] Clearing invalid token and redirecting to login...`);

                    // Clear the invalid token
                    this.removeToken();

                    // Redirect to login page
                    if (window.location.pathname !== '/auth') {
                        window.location.href = '/auth';
                    }

                    throw new Error('Session expired. Please login again.');
                }

                console.error(`[API Error] ${config.method || 'GET'} ${url} - ${errorMessage}`);
                throw new Error(errorMessage);
            }

            // Handle non-JSON responses (like Excel downloads)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }

            return response;
        } catch (error: any) {
            // Enhanced error logging
            if (error.message === 'Failed to fetch') {
                console.error(`[API] Network error - Cannot reach ${url}`);
                console.error('[API] Check if backend is running on http://localhost:3001');
                throw new Error('Cannot connect to server. Please ensure the backend is running.');
            }
            console.error(`[API] Error for ${url}:`, error.message);
            throw error;
        }
    }

    async get(endpoint: string) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint: string, data: any) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint: string, data: any) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint: string) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
