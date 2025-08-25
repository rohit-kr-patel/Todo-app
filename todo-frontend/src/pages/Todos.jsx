"use client"

import { useEffect, useState } from "react"
import { apiGet, endpoints } from "../api.js"
import { useAuth } from "../auth.jsx"
import { useTodos } from "../contexts/TodoContext.jsx"
import Navbar from "../components/Navbar.jsx"
import Chatbot from "../components/ChatBot.jsx"

export default function Todos() {
  const { logout, email } = useAuth()
  const { filteredTodos, loading, error, tab, setTab, addTodo, completeTodo, deleteTodo, clearError } = useTodos()

  const [task, setTask] = useState("")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    clearError()
    ;(async () => {
      try {
        const me = await apiGet(endpoints.me)
        const full = [me.fn, me.ln].filter(Boolean).join(" ").trim()
        setUserName(full || me.email || "")
      } catch {}
    })()
  }, [clearError])

  async function addItem(e) {
    e.preventDefault()
    if (!task.trim()) return
    await addTodo(task)
    setTask("") // Clear input after adding
  }

  async function completeItem(id) {
    await completeTodo(id)
  }

  async function deleteItem(id) {
    await deleteTodo(id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Navbar />

        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setTab("list")} className={`tab ${tab === "list" ? "tab-active" : ""}`}>
            My Todo List
          </button>
          <button onClick={() => setTab("completed")} className={`tab ${tab === "completed" ? "tab-active" : ""}`}>
            Completed
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <form onSubmit={addItem} className="flex gap-2 mb-4">
          <input
            className="input"
            placeholder="Enter your todo item"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </form>

        <div className="card p-0 overflow-hidden">
          {loading && <div className="px-4 py-6 text-center text-gray-500">Loading...</div>}
          {!loading && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Task</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTodos.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                      You don't have any todo item.
                    </td>
                  </tr>
                )}
                {filteredTodos.map((t, idx) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{t.task}</td>
                    <td className="px-4 py-2 capitalize">{t.status || "pending"}</td>
                    <td className="px-4 py-2">
                      {t.status !== "completed" && (
                        <button onClick={() => completeItem(t.id)} className="btn btn-secondary mr-2">
                          Complete
                        </button>
                      )}
                      <button onClick={() => deleteItem(t.id)} className="btn btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Chatbot/>
    </div>
  )
}
