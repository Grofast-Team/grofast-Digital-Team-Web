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
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlineTrendingUp
} from 'react-icons/hi'

const Dashboard = () => {
  const { employee, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)

  const [adminStats, setAdminStats] = useState({
    presentCount: 0, absentCount: 0, totalEmployees: 0,
    activeClients: 0, pendingTasks: 0, pendingLeaves: 0
  })
  const [announcement, setAnnouncement] = useState(null)
  const [clients, setClients] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [pendingLeaves, setPendingLeaves] = useState([])

  const [employeeStats, setEmployeeStats] = useState({
    myTasks: 0, completedTasks: 0, pendingLeaves: 0,
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
    } else {
      // If no employee data after auth, stop loading
      const timer = setTimeout(() => setLoading(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [employee])

  const fetchAdminDashboard = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Use Promise.allSettled so one failing query doesn't block everything
      const results = await Promise.allSettled([
        supabase.from('employees').select('id, name, role, department'),
        supabase.from('attendance').select('employee_id, check_in').eq('date', today),
        supabase.from('clients').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tasks').select('*, assigned_employee:employees!assigned_to(name)').neq('status', 'completed').order('created_at', { ascending: false }).limit(5),
        supabase.from('leave_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(3)
      ])

      const getData = (index) => results[index]?.status === 'fulfilled' ? results[index].value?.data : null

      const employees = getData(0)
      const attendance = getData(1)
      const clientsData = getData(2)
      const announcementData = getData(3)
      const tasksData = getData(4)
      const leavesData = getData(5)

      const presentCount = attendance?.length || 0
      const absentCount = (employees?.length || 0) - presentCount

      const employeeMap = {}
      employees?.forEach(emp => { employeeMap[emp.id] = emp })
      const leavesWithEmployee = (leavesData || []).map(leave => ({
        ...leave, employee: employeeMap[leave.employee_id] || null
      }))

      setAdminStats({
        presentCount, absentCount,
        totalEmployees: employees?.length || 0,
        activeClients: clientsData?.length || 0,
        pendingTasks: tasksData?.length || 0,
        pendingLeaves: leavesData?.length || 0
      })
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

      const results = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('assigned_to', employee.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('*').eq('employee_id', employee.id).eq('date', today).maybeSingle(),
        supabase.from('leave_requests').select('*').eq('employee_id', employee.id).eq('status', 'pending'),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ])

      const getData = (i) => results[i]?.status === 'fulfilled' ? results[i].value?.data : null
      const tasksData = getData(0)
      const attendanceData = getData(1)
      const leavesData = getData(2)
      const announcementData = getData(3)

      setEmployeeStats({
        myTasks: tasksData?.filter(t => t.status !== 'completed').length || 0,
        completedTasks: tasksData?.filter(t => t.status === 'completed').length || 0,
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // =================== ADMIN DASHBOARD ===================
  if (isAdmin()) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Announcement */}
        {announcement && (
          <div className="gradient-hero rounded-2xl p-5 shadow-glow-red animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <HiOutlineSpeakerphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{announcement.title}</h3>
                <p className="text-white/70 text-xs mt-0.5">{announcement.message || announcement.content}</p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {employee?.name?.split(' ')[0] || 'Admin'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Here's your team overview for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Present Today" value={adminStats.presentCount} icon={HiOutlineCheckCircle} color="emerald" />
          <StatCard label="Absent Today" value={adminStats.absentCount} icon={HiOutlineXCircle} color="red" />
          <StatCard label="Active Clients" value={adminStats.activeClients} icon={HiOutlineBriefcase} color="blue" />
          <StatCard label="Pending Tasks" value={adminStats.pendingTasks} icon={HiOutlineClipboardList} color="amber" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title">Active Clients</h3>
              <Link to="/client-of-month" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View All <HiOutlineArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {clients.length > 0 ? clients.map((client) => (
                <div key={client.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="avatar-md">
                    <span>{client.name?.charAt(0)?.toUpperCase() || 'C'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{client.name}</p>
                    <p className="text-xs text-gray-400 truncate">{client.company || 'No company'}</p>
                  </div>
                  {client.is_client_of_month && (
                    <div className="p-1.5 bg-amber-50 rounded-lg">
                      <HiOutlineStar className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </div>
              )) : (
                <EmptyState icon={HiOutlineBriefcase} text="No clients yet" />
              )}
            </div>
          </div>

          {/* Pending Leaves */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title">Pending Leaves</h3>
              <Link to="/leaves" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Review <HiOutlineArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {pendingLeaves.length > 0 ? pendingLeaves.map((leave) => (
                <div key={leave.id} className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <p className="font-semibold text-gray-900 text-sm">{leave.employee?.name || 'Team Member'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{leave.leave_type} Leave</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </p>
                </div>
              )) : (
                <EmptyState icon={HiOutlineDocumentText} text="No pending requests" />
              )}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="section-title">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View Board <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-gray-100 bg-surface-50">
                  <th className="text-left py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Task</th>
                  <th className="text-left py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Assigned To</th>
                  <th className="text-left py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Priority</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                    </td>
                    <td className="py-3.5 px-6 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{task.assigned_employee?.name || 'Unassigned'}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`badge ${
                        task.status === 'completed' ? 'badge-success' :
                        task.status === 'in_progress' ? 'badge-info' : 'badge-neutral'
                      }`}>
                        {task.status === 'in_progress' ? 'In Progress' : task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 hidden md:table-cell">
                      <span className={`badge ${
                        task.priority === 'high' ? 'badge-error' :
                        task.priority === 'medium' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentTasks.length === 0 && (
              <div className="py-10"><EmptyState icon={HiOutlineClipboardList} text="No tasks yet" /></div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // =================== TEAM MEMBER DASHBOARD ===================
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Announcement */}
      {announcement && (
        <div className="gradient-hero rounded-2xl p-5 shadow-glow-red animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <HiOutlineSpeakerphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{announcement.title}</h3>
              <p className="text-white/70 text-xs mt-0.5">{announcement.message || announcement.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Welcome back, {employee?.name?.split(' ')[0] || 'User'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your work today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance"
          value={employeeStats.attendanceStatus === 'checked_in' ? 'In' :
                 employeeStats.attendanceStatus === 'checked_out' ? 'Out' : '--'}
          icon={HiOutlineClock}
          color={employeeStats.attendanceStatus === 'checked_in' ? 'emerald' :
                 employeeStats.attendanceStatus === 'checked_out' ? 'blue' : 'amber'}
          subtitle={employeeStats.attendanceStatus === 'checked_in' ? 'Checked In' :
                    employeeStats.attendanceStatus === 'checked_out' ? 'Checked Out' : 'Not Checked In'}
        />
        <StatCard label="My Tasks" value={employeeStats.myTasks} icon={HiOutlineClipboardList} color="blue" />
        <StatCard label="Completed" value={employeeStats.completedTasks} icon={HiOutlineCheckCircle} color="emerald" />
        <StatCard label="Pending Leaves" value={employeeStats.pendingLeaves} icon={HiOutlineDocumentText} color="amber" />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">My Tasks</h3>
            <Link to="/tasks" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {myTasks.length > 0 ? myTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{task.description?.substring(0, 60) || 'No description'}</p>
                </div>
                <span className={`badge ${
                  task.status === 'completed' ? 'badge-success' :
                  task.status === 'in_progress' ? 'badge-info' : 'badge-neutral'
                }`}>
                  {task.status === 'in_progress' ? 'In Progress' : task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
                </span>
              </div>
            )) : (
              <EmptyState icon={HiOutlineClipboardList} text="No tasks assigned" />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { to: '/tasks', icon: HiOutlineClipboardList, label: 'View Tasks', color: 'text-blue-500 bg-blue-50' },
              { to: '/my-leaves', icon: HiOutlineDocumentText, label: 'Request Leave', color: 'text-amber-500 bg-amber-50' },
              { to: '/calendar', icon: HiOutlineCalendar, label: 'View Calendar', color: 'text-purple-500 bg-purple-50' },
              { to: '/team', icon: HiOutlineUserGroup, label: 'Team Details', color: 'text-emerald-500 bg-emerald-50' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-all duration-200 group"
              >
                <div className={`p-2 rounded-lg ${color} transition-transform group-hover:scale-110`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =================== COMPONENTS ===================

const StatCard = ({ label, value, icon: Icon, color, trend, subtitle }) => {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className={`text-2xl font-bold mt-1 tracking-tight ${c.text}`}>{value}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <HiOutlineTrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">{trend} today</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  )
}

const EmptyState = ({ icon: Icon, text }) => (
  <div className="text-center py-8">
    <Icon className="w-10 h-10 mx-auto text-gray-200 mb-2" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
)

export default Dashboard
