
// Main application routing and context providers


import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Todos from "./pages/Todos.jsx"
import Profile from "./pages/Profile.jsx"
import Forgot from "./pages/Forgot.jsx"
import { useAuth } from "./auth.jsx"
import { TodoProvider } from "./contexts/TodoContext.jsx"
import { UserProvider } from "./contexts/UserContext.jsx"

// Protect routes that require authentication
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    // Redirect unauthenticated users to login
    return <Navigate to="/" replace state={{ from: location }} />
  }
  return children
}

// Redirect authenticated users away from login/register/forgot
function RedirectIfAuthed({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    // If already logged in, go to todos
    return <Navigate to="/todos" replace />
  }
  return children
}

// Main App component: defines all routes and wraps protected pages with providers
export default function App() {
  return (
    <Routes>
      {/* Public routes: login, register, forgot password */}
      <Route
        path="/"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/forgot"
        element={
          <RedirectIfAuthed>
            <Forgot />
          </RedirectIfAuthed>
        }
      />
      {/* Protected routes: todos and profile require authentication */}
      <Route
        path="/todos"
        element={
          <RequireAuth>
            {/* UserProvider and TodoProvider supply user/todo context to children */}
            <UserProvider>
              <TodoProvider>
                <Todos />
              </TodoProvider>
            </UserProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <UserProvider>
              <TodoProvider>
                <Profile />
              </TodoProvider>
            </UserProvider>
          </RequireAuth>
        }
      />
      {/* Catch-all: redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
