import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineDocumentText,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineFilter
} from 'react-icons/hi'

const LeaveApproval = () => {
  const { employee } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    fetchLeaves()
  }, [filter])

  const fetchLeaves = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*, employee:employees(name, email, department)')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setLeaves(data || [])
    } catch (error) {
      console.error('Error fetching leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (leaveId) => {
    setProcessing(leaveId)
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: employee.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', leaveId)

      if (error) throw error
      fetchLeaves()
    } catch (error) {
      console.error('Error approving leave:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (leaveId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    setProcessing(leaveId)
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: employee.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', leaveId)

      if (error) throw error
      fetchLeaves()
    } catch (error) {
      console.error('Error rejecting leave:', error)
    } finally {
      setProcessing(null)
    }
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

  const getStatusBadge = (status) => {
    const statuses = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return statuses[status] || 'bg-gray-100 text-gray-700'
  }

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
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
          <h1 className="text-2xl font-bold text-gray-900">Leave Approval</h1>
          <p className="text-gray-500">Review and manage leave requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-2">
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests */}
      <div className="space-y-4">
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <div key={leave.id} className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Employee Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {leave.employee?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{leave.employee?.name}</h3>
                    <p className="text-sm text-gray-500">{leave.employee?.department || 'No department'}</p>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
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
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>Reason:</strong> {leave.reason}
                    </p>
                  )}
                  {leave.rejection_reason && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <strong>Rejected:</strong> {leave.rejection_reason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {leave.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      disabled={processing === leave.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <HiOutlineCheck className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      disabled={processing === leave.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <HiOutlineX className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <HiOutlineDocumentText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No leave requests found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaveApproval
