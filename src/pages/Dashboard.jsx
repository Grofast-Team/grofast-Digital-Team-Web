import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineSpeakerphone,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineCalendar
} from 'react-icons/hi'

const Dashboard = () => {
  const { employee, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)

  // Admin stats
  const [adminStats, setAdminStats] = useState({
    presentCount: 0,
    absentCount: 0,
    totalEmployees: 0,
    activeClients: 0,
    pendingTasks: 0,
    pendingLeaves: 0
  })
  const [announcement, setAnnouncement] = useState(null)
  const [clients, setClients] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [pendingLeaves, setPendingLeaves] = useState([])

  // Employee stats
  const [employeeStats, setEmployeeStats] = useState({
    myTasks: 0,
    completedTasks: 0,
    pendingLeaves: 0,
    attendanceStatus: 'not_checked_in'
  })
  const [myTasks, setMyTasks] = useState([])

  useEffect(() => {
    if (employee) {
      if (isAdmin()) {
        fetchAdminDashboard()
      } else {
        fetchEmployeeDashboard()
      }
    }
  }, [employee])

  const fetchAdminDashboard = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Run all queries in parallel for faster loading
      const [
        { data: employees },
        { data: attendance },
        { data: clientsData },
        { data: announcementData },
        { data: tasksData },
        { data: leavesData }
      ] = await Promise.all([
        supabase.from('employees').select('id, name, role, department'),
        supabase.from('attendance').select('employee_id, check_in').eq('date', today),
        supabase.from('clients').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tasks').select('*, assigned_employee:employees!assigned_to(name)').neq('status', 'completed').order('created_at', { ascending: false }).limit(5),
        supabase.from('leave_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(3)
      ])

      const presentIds = attendance?.map(a => a.employee_id) || []
      const presentCount = presentIds.length
      const absentCount = (employees?.length || 0) - presentCount

      setAdminStats({
        presentCount,
        absentCount,
        totalEmployees: employees?.length || 0,
        activeClients: clientsData?.length || 0,
        pendingTasks: tasksData?.length || 0,
        pendingLeaves: leavesData?.length || 0
      })

      // Map employee names to leave requests
      const employeeMap = {}
      employees?.forEach(emp => { employeeMap[emp.id] = emp })
      const leavesWithEmployee = (leavesData || []).map(leave => ({
        ...leave,
        employee: employeeMap[leave.employee_id] || null
      }))

      setAnnouncement(announcementData)
      setClients(clientsData || [])
      setRecentTasks(tasksData || [])
      setPendingLeaves(leavesWithEmployee)

    } catch (error) {
      console.error('Error fetching admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDashboard = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Run all queries in parallel for faster loading
      const [
        { data: tasksData },
        { data: attendanceData },
        { data: leavesData },
        { data: announcementData }
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('assigned_to', employee.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('*').eq('employee_id', employee.id).eq('date', today).maybeSingle(),
        supabase.from('leave_requests').select('*').eq('employee_id', employee.id).eq('status', 'pending'),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ])

      const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0
      const pendingTasks = tasksData?.filter(t => t.status !== 'completed').length || 0

      setEmployeeStats({
        myTasks: pendingTasks,
        completedTasks,
        pendingLeaves: leavesData?.length || 0,
        attendanceStatus: attendanceData
          ? (attendanceData.check_out ? 'checked_out' : 'checked_in')
          : 'not_checked_in'
      })

      setMyTasks(tasksData || [])
      setAnnouncement(announcementData)

    } catch (error) {
      console.error('Error fetching employee dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Admin Dashboard
  if (isAdmin()) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Announcement Banner */}
        {announcement && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <HiOutlineSpeakerphone className="w-6 h-6 text-white flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold">{announcement.title}</h3>
                <p className="text-white/80 text-sm">{announcement.message || announcement.content}</p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {employee?.name?.split(' ')[0] || 'Admin'}!
          </h2>
          <p className="text-gray-500 mt-1">
            Here's your team overview for today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Present */}
          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Today</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{adminStats.presentCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Absent */}
          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent Today</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{adminStats.absentCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <HiOutlineXCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Active Clients */}
          <div className="card p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Clients</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{adminStats.activeClients}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <HiOutlineBriefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="card p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{adminStats.pendingTasks}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <HiOutlineClipboardList className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Clients</h3>
              <Link to="/client-of-month" className="text-sm text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {client.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{client.name}</p>
                      <p className="text-sm text-gray-500 truncate">{client.company || 'No company'}</p>
                    </div>
                    {client.is_client_of_month && (
                      <HiOutlineStar className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiOutlineBriefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No clients yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Leaves</h3>
              <Link to="/leaves" className="text-sm text-primary-600 hover:text-primary-700">
                Review →
              </Link>
            </div>
            <div className="space-y-3">
              {pendingLeaves.length > 0 ? (
                pendingLeaves.map((leave) => (
                  <div key={leave.id} className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="font-medium text-gray-900">{leave.employee?.name || 'Employee'}</p>
                    <p className="text-sm text-gray-500">{leave.leave_type} Leave</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending requests</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
              View Board →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Task</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Assigned To</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{task.title}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {task.assigned_employee?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'in_progress' ? 'In Progress' :
                         task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Employee Dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Announcement Banner */}
      {announcement && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <HiOutlineSpeakerphone className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold">{announcement.title}</h3>
              <p className="text-white/80 text-sm">{announcement.message || announcement.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {employee?.name?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your work today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Status */}
        <div className={`card p-6 border-l-4 ${
          employeeStats.attendanceStatus === 'checked_in' ? 'border-green-500' :
          employeeStats.attendanceStatus === 'checked_out' ? 'border-blue-500' :
          'border-yellow-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className={`text-lg font-bold mt-1 ${
                employeeStats.attendanceStatus === 'checked_in' ? 'text-green-600' :
                employeeStats.attendanceStatus === 'checked_out' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {employeeStats.attendanceStatus === 'checked_in' ? 'Checked In' :
                 employeeStats.attendanceStatus === 'checked_out' ? 'Checked Out' :
                 'Not Checked In'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${
              employeeStats.attendanceStatus === 'checked_in' ? 'bg-green-100' :
              employeeStats.attendanceStatus === 'checked_out' ? 'bg-blue-100' :
              'bg-yellow-100'
            }`}>
              <HiOutlineClock className={`w-6 h-6 ${
                employeeStats.attendanceStatus === 'checked_in' ? 'text-green-600' :
                employeeStats.attendanceStatus === 'checked_out' ? 'text-blue-600' :
                'text-yellow-600'
              }`} />
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div className="card p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Tasks</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{employeeStats.myTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <HiOutlineClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{employeeStats.completedTasks}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="card p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Leaves</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{employeeStats.pendingLeaves}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <HiOutlineDocumentText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks List */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.description?.substring(0, 50) || 'No description'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status === 'in_progress' ? 'In Progress' :
                     task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tasks assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/tasks"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiOutlineClipboardList className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">View Tasks</span>
            </Link>
            <Link
              to="/my-leaves"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiOutlineDocumentText className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700">Request Leave</span>
            </Link>
            <Link
              to="/calendar"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiOutlineCalendar className="w-5 h-5 text-purple-500" />
              <span className="text-gray-700">View Calendar</span>
            </Link>
            <Link
              to="/team"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiOutlineUserGroup className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Team Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
