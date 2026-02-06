import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlinePlus,
  HiOutlineDotsVertical,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineX,
  HiOutlineFlag
} from 'react-icons/hi'

const Tasks = () => {
  const { employee, isAdmin } = useAuth()
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    status: 'pending'
  })

  const columns = [
    { id: 'pending', title: 'Pending', color: 'bg-gray-500' },
    { id: 'in_progress', title: 'Work in Progress', color: 'bg-blue-500' },
    { id: 'completed', title: 'Completed', color: 'bg-green-500' }
  ]

  useEffect(() => {
    fetchTasks()
    if (isAdmin()) {
      fetchEmployees()
    }
  }, [employee])

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select('*, assigned_employee:employees(id, name)')
        .order('created_at', { ascending: false })

      // If not admin, only show own tasks
      if (!isAdmin()) {
        query = query.eq('assigned_to', employee.id)
      }

      const { data, error } = await query

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name')
        .eq('is_active', true)

      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description,
            assigned_to: formData.assigned_to || null,
            priority: formData.priority,
            due_date: formData.due_date || null,
            status: formData.status
          })
          .eq('id', editingTask.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert({
            title: formData.title,
            description: formData.description,
            assigned_to: formData.assigned_to || null,
            priority: formData.priority,
            due_date: formData.due_date || null,
            status: formData.status,
            created_by: employee.id
          })

        if (error) throw error
      }

      setShowModal(false)
      setEditingTask(null)
      resetForm()
      fetchTasks()
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== columnId) {
      handleStatusChange(draggedTask.id, columnId)
    }
    setDraggedTask(null)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      due_date: task.due_date || '',
      status: task.status
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium',
      due_date: '',
      status: 'pending'
    })
  }

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-500">Manage and track your team's tasks</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => {
              resetForm()
              setEditingTask(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Task
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-gray-100 rounded-xl p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="ml-auto bg-gray-200 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                {getTasksByStatus(column.id).length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[200px]">
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {isAdmin() && (
                      <div className="relative group">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <HiOutlineDotsVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="absolute right-0 top-6 bg-white shadow-lg rounded-lg py-1 hidden group-hover:block z-10 min-w-[120px]">
                          <button
                            onClick={() => openEditModal(task)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs">
                    {/* Priority */}
                    <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                      <HiOutlineFlag className="w-3 h-3" />
                      <span className="capitalize">{task.priority}</span>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <HiOutlineCalendar className="w-3 h-3" />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Assignee */}
                    {task.assigned_employee && (
                      <div className="flex items-center gap-1 text-gray-500 ml-auto">
                        <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs text-primary-600 font-medium">
                            {task.assigned_employee.name?.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingTask(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTask(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingTask ? 'Update' : 'Create'} Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
