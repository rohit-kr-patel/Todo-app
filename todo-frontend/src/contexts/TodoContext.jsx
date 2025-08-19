


// TodoContext: manages todo list state and actions
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiDelete, apiGet, apiPost, apiPut, endpoints } from "../api.js"

// Create context for todos
const TodoContext = createContext(null)

// TodoProvider: supplies todo state and actions to children
export function TodoProvider({ children }) {
  // State: todo items, loading, error, tab (list/completed)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("list") // list | completed

  // Load todos from backend
  async function loadTodos() {
    setLoading(true)
    setError("")
    try {
      const rows = await apiGet(endpoints.todos)
      setItems(rows)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new todo item
  async function addTodo(task) {
    if (!task.trim()) return
    setError("")
    try {
      await apiPost(endpoints.todos, { task })
      await loadTodos() // Reload to get updated list
    } catch (err) {
      setError(err.message)
    }
  }

  // Mark todo as complete
  async function completeTodo(id) {
    setError("")
    try {
      await apiPut(endpoints.complete(id))
      setTab("completed") // Switch to completed tab
      await loadTodos()
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete todo item
  async function deleteTodo(id) {
    setError("")
    try {
      await apiDelete(endpoints.remove(id))
      await loadTodos()
    } catch (err) {
      setError(err.message)
    }
  }

  // Clear error message
  function clearError() {
    setError("")
  }

  // Filter todos based on tab (list/completed)
  const filteredTodos = useMemo(() => {
    return items.filter((todo) => (tab === "completed" ? todo.status === "completed" : todo.status !== "completed"))
  }, [items, tab])

  // Load todos on mount
  useEffect(() => {
    loadTodos()
  }, [])

  // Context value: exposes todo state and actions
  const value = useMemo(
    () => ({
      items,
      filteredTodos,
      loading,
      error,
      tab,
      setTab,
      loadTodos,
      addTodo,
      completeTodo,
      deleteTodo,
      clearError,
    }),
    [items, filteredTodos, loading, error, tab],
  )

  // Provide todo context to children
  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>
}

// useTodos hook: access todo context in components
export function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error("useTodos must be used within TodoProvider")
  return ctx
}
