"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../auth.jsx"
import { useUser } from "../contexts/UserContext.jsx"
import { apiPut, endpoints } from "../api.js"
import Navbar from "../components/Navbar.jsx"

export default function Profile() {
  const { email } = useAuth()
  const { user, updateProfile, updateAvatar, isLoading } = useUser()
  const [saved, setSaved] = useState(false)
  const [pwMsg, setPwMsg] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    setFirstName(user?.firstName || "")
    setLastName(user?.lastName || "")
  }, [user])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function saveProfile() {
    try {
      // Save profile data
      await updateProfile({ fn: firstName, ln: lastName })

      // Save avatar if file selected
      if (selectedFile) {
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const base64 = ev.target.result
          try {
            const res = await apiPut(endpoints.avatar, { data: base64 })
            // updateAvatar expects a full URL (UserContext prefixes base URL)
            updateAvatar(res.avatarUrl ? `${res.avatarUrl}` : null)
            setSelectedFile(null)
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
            }
          } catch (err) {
            console.error('Failed to upload avatar during save:', err)
          }
        }
        reader.readAsDataURL(selectedFile)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    } catch (error) {
      console.error("Failed to save profile:", error)
    }
  }

  function onAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg("")
    try {
      await apiPut(endpoints.changePassword, { oldPassword, newPassword })
      setPwMsg("Password changed successfully")
      setOldPassword("")
      setNewPassword("")
    } catch (err) {
      setPwMsg(err.message || "Failed to change password")
    }
  }

  const initialsSeed = [firstName, lastName].filter(Boolean).join(" ").trim() || "User"
  const placeholderAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    initialsSeed
  )}&chars=2&fontWeight=700&backgroundType=gradientLinear`

  // If editing → show preview, else backend avatar, else placeholder
  const displayAvatar = previewUrl || user.avatar || placeholderAvatar

  // const displayAvatar = previewUrl || `http://localhost:5000/uploads/avatars/${user.id}.png` || placeholderAvatar

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Navbar />
        <div className="card">
          <h2 className="text-2xl font-semibold mb-1">My Profile</h2>
          <p className="text-sm text-gray-500 mb-6">{email}</p>
          {saved && <p className="text-sm text-green-600 mb-3">Saved!</p>}

          <div className="grid gap-4">
            <div className="flex flex-col items-center gap-3">
              <img
                src={displayAvatar }
                className="w-28 h-28 rounded-full border object-cover ring-2 ring-indigo-200"
                alt="avatar"
              />
              <label className="btn btn-secondary cursor-pointer">
                <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
                {selectedFile ? "Change photo" : "Upload photo"}
              </label>
              {selectedFile && <p className="text-xs text-orange-600">Click "Save" to update your photo</p>}
            </div>

            <div>
              <label className="label">First Name</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <button onClick={saveProfile} className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          {pwMsg && (
            <p className={`text-sm mb-3 ${pwMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {pwMsg}
            </p>
          )}
          <form onSubmit={changePassword} className="grid gap-4">
            <div>
              <label className="label">Old Password</label>
              <input
                className="input"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <button className="btn btn-primary w-fit" type="submit">
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
