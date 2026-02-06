import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi'

const TeamDetails = () => {
  const { employee, isAdmin } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEmployee, setExpandedEmployee] = useState(null)
  const [employeeTasks, setEmployeeTasks] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeTasks = async (employeeId) => {
    if (employeeTasks[employeeId]) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', employeeId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setEmployeeTasks(prev => ({ ...prev, [employeeId]: data || [] }))
    } catch (error) {
      console.error('Error fetching employee tasks:', error)
    }
  }

  const toggleEmployee = (employeeId) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null)
    } else {
      setExpandedEmployee(employeeId)
      fetchEmployeeTasks(employeeId)
    }
  }

  const getTaskStats = (tasks) => {
    if (!tasks) return { pending: 0, inProgress: 0, completed: 0 }
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Details</h1>
        <p className="text-gray-500">View your team members and their work details</p>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search by name, department, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Team Grid */}
      <div className="space-y-4">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="card overflow-hidden">
            {/* Employee Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleEmployee(emp.id)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-semibold">
                    {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{emp.name}</h3>
                    {emp.role === 'admin' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{emp.department || 'No department'}</p>
                </div>

                {/* Contact Info */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HiOutlineMail className="w-4 h-4" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <HiOutlinePhone className="w-4 h-4" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>

                {/* Expand Icon */}
                <div className="text-gray-400">
                  {expandedEmployee === emp.id ? (
                    <HiOutlineChevronUp className="w-5 h-5" />
                  ) : (
                    <HiOutlineChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedEmployee === emp.id && (
              <div className="border-t bg-gray-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Stats */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <HiOutlineClipboardList className="w-5 h-5 text-primary-500" />
                      Task Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center border">
                        <p className="text-2xl font-bold text-gray-500">
                          {getTaskStats(employeeTasks[emp.id]).pending}
                        </p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border">
                        <p className="text-2xl font-bold text-blue-500">
                          {getTaskStats(employeeTasks[emp.id]).inProgress}
                        </p>
                        <p className="text-xs text-gray-500">In Progress</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border">
                        <p className="text-2xl font-bold text-green-500">
                          {getTaskStats(employeeTasks[emp.id]).completed}
                        </p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <HiOutlineBriefcase className="w-5 h-5 text-primary-500" />
                      Recent Tasks
                    </h4>
                    <div className="space-y-2">
                      {employeeTasks[emp.id]?.length > 0 ? (
                        employeeTasks[emp.id].map((task) => (
                          <div
                            key={task.id}
                            className="bg-white rounded-lg p-3 border flex items-center gap-3"
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-sm text-gray-700 truncate flex-1">
                              {task.title}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No tasks assigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Contact Info */}
                <div className="md:hidden mt-4 pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HiOutlineMail className="w-4 h-4" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <HiOutlinePhone className="w-4 h-4" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="card p-8 text-center">
            <HiOutlineUser className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No team members found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamDetails
