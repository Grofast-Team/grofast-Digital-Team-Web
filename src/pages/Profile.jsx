import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlineX
} from 'react-icons/hi'

const Profile = () => {
  const { employee, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    totalLeaves: 0,
    approvedLeaves: 0
  })

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    designation: ''
  })

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || ''
      })
      fetchStats()
    }
  }, [employee])

  const fetchStats = async () => {
    try {
      // Fetch tasks stats
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', employee.id)

      const tasks = tasksData || []
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      const pendingTasks = tasks.filter(t => t.status === 'pending').length
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length

      // Fetch leaves stats
      const { data: leavesData } = await supabase
        .from('leave_requests')
        .select('status')
        .eq('employee_id', employee.id)

      const leaves = leavesData || []
      const approvedLeaves = leaves.filter(l => l.status === 'approved').length

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalLeaves: leaves.length,
        approvedLeaves
      })

    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: formData.name,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation
        })
        .eq('id', employee.id)

      if (error) throw error

      setShowEditModal(false)
      window.location.reload() // Refresh to update context
    } catch (error) {
      console.error('Error updating profile:', error)
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
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-4xl font-bold">
              {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{employee?.name}</h1>
              {employee?.role === 'admin' && (
                <span className="px-3 py-1 text-sm font-medium bg-primary-100 text-primary-700 rounded-full">
                  Administrator
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">{employee?.designation || employee?.role || 'Employee'}</p>
            <p className="text-gray-400 text-sm mt-1">{employee?.department || 'No department assigned'}</p>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <HiOutlinePencil className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Contact & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <HiOutlineMail className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{employee?.email || user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <HiOutlinePhone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">{employee?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <HiOutlineBriefcase className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-gray-900">{employee?.department || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <HiOutlineCalendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900">
                  {employee?.created_at
                    ? new Date(employee.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Stats */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <HiOutlineClipboardList className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.totalTasks}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <HiOutlineCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <HiOutlineClock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTasks}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <HiOutlineCalendar className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-600">{stats.approvedLeaves}</p>
              <p className="text-sm text-gray-500">Leaves Taken</p>
            </div>
          </div>

          {/* Task Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Task Completion Rate</span>
              <span className="font-medium text-gray-700">
                {stats.totalTasks > 0
                  ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.totalTasks > 0
                    ? (stats.completedTasks / stats.totalTasks) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Marketing, Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Senior Developer, Marketing Manager"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
