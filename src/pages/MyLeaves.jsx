import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineDocumentText
} from 'react-icons/hi'

const MyLeaves = () => {
  const { employee } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: ''
  })

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'annual', label: 'Annual Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    fetchLeaves()
  }, [employee])

  const fetchLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeaves(data || [])
    } catch (error) {
      console.error('Error fetching leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: employee.id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          status: 'pending'
        })

      if (error) throw error

      setShowModal(false)
      resetForm()
      fetchLeaves()
    } catch (error) {
      console.error('Error submitting leave request:', error)
    }
  }

  const handleCancel = async (leaveId) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return

    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', leaveId)
        .eq('status', 'pending') // Can only cancel pending requests

      if (error) throw error
      fetchLeaves()
    } catch (error) {
      console.error('Error cancelling leave:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      leave_type: 'casual',
      start_date: '',
      end_date: '',
      reason: ''
    })
  }

  const getStatusBadge = (status) => {
    const statuses = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return statuses[status] || 'bg-gray-100 text-gray-700'
  }

  const getLeaveTypeBadge = (type) => {
    const types = {
      sick: 'bg-red-100 text-red-700',
      casual: 'bg-blue-100 text-blue-700',
      annual: 'bg-green-100 text-green-700',
      emergency: 'bg-orange-100 text-orange-700',
      other: 'bg-gray-100 text-gray-700'
    }
    return types[type] || types.other
  }

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Get stats
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
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
          <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
          <p className="text-gray-500">Request and track your leave applications</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Request Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Requests</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </div>
      </div>

      {/* Leave List */}
      <div className="space-y-4">
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <div key={leave.id} className="card p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLeaveTypeBadge(leave.leave_type)}`}>
                      {leave.leave_type?.charAt(0).toUpperCase() + leave.leave_type?.slice(1)} Leave
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(leave.status)}`}>
                      {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <HiOutlineCalendar className="w-4 h-4" />
                      <span>
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HiOutlineClock className="w-4 h-4" />
                      <span>{calculateDays(leave.start_date, leave.end_date)} days</span>
                    </div>
                  </div>

                  {leave.reason && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Reason:</strong> {leave.reason}
                    </p>
                  )}

                  {leave.rejection_reason && (
                    <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                      <strong>Rejection Reason:</strong> {leave.rejection_reason}
                    </p>
                  )}
                </div>

                {leave.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(leave.id)}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <HiOutlineDocumentText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No leave requests yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Request your first leave
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Request Leave
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type *
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="input-field"
                  required
                >
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field"
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Please provide a reason for your leave request..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyLeaves
