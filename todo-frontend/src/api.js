// API client for communicating with backend endpoints
const API_BASE_URL = "https://todo-app-production-9b6c.up.railway.app"; // Backend base URL

// Helper: Get Authorization header if user is logged in
function getAuthHeader() {
  // Prefer in-memory token to avoid race on login
  const token = (typeof window !== 'undefined' && window.__auth_token) || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Main request function: handles all HTTP methods and error parsing
async function apiRequest(path, method = "GET", body = null) {
  let headers = { ...getAuthHeader() };
  let requestBody = body;

  // ✅ If body is FormData (file upload), don't set Content-Type
  if (body instanceof FormData) {
    // Let the browser set Content-Type automatically
  } else if (body) {
    // ✅ Otherwise send JSON
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? requestBody : undefined,
  });

  // Parse error messages from backend
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
      if (data.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

// Simple wrappers for common HTTP methods
export function apiGet(path) {
  return apiRequest(path, "GET");
}

export function apiPost(path, body) {
  return apiRequest(path, "POST", body);
}

export function apiPut(path, body) {
  return apiRequest(path, "PUT", body);
}

export function apiDelete(path) {
  return apiRequest(path, "DELETE");
}

// All backend endpoints used in the app
export const endpoints = {
  register: "/create",            // Create new user
  login: "/login",                // Login user
  logout: "/logout",              // Logout user
  todos: "/items",                // Get/create todos
  complete: (id) => `/items/${id}/complete`, // Mark todo complete
  remove: (id) => `/items/${id}`,
  me: "/me",                      // Get current user profile
  changePassword: "/me/password", // Change password
  avatar: "/me/avatar",           // Update avatar
};

// Expose base URL for reference
export function getApiBaseUrl() {
  return API_BASE_URL;
}
