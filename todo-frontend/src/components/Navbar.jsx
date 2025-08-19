"use client"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../auth.jsx"
import { useUser } from "../contexts/UserContext.jsx"

export default function Navbar() {
  const { logout } = useAuth()
  const { user } = useUser()
  const location = useLocation()

  return (
    <nav className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
  {/* Removed profile image from navbar as requested */}
        <div>
          <p className="text-sm text-gray-500">Welcome</p>
          <h2 className="text-xl font-semibold">{user.isLoading ? "Loading..." : user.fullName || "User"}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {location.pathname.startsWith("/profile") ? (
          <Link to="/todos" className="btn btn-secondary">
            Home
          </Link>
        ) : (
          <Link to="/profile" className="btn btn-secondary">
            My Profile
          </Link>
        )}
        <button className="btn btn-danger" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  )
}
