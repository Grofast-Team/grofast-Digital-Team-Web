import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineChartBar,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineClock
} from 'react-icons/hi'

const Reports = () => {
  const { employee, isAdmin } = useAuth()
  const [employees, setEmployees] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('today')
  const [selectedEmployee, setSelectedEmployee] = useState('all')

  useEffect(() => {
    if (isAdmin()) {
      fetchReportData()
    }
  }, [employee, dateRange, selectedEmployee])

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // Get date range
      let startDate, endDate
      const now = new Date()

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
          break
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
          endDate = new Date().toISOString()
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          endDate = new Date().toISOString()
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
          endDate = new Date().toISOString()
      }

      // Fetch employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      setEmployees(employeesData || [])

      // Fetch aggregated stats
      let workQuery = supabase
        .from('work_updates')
        .select('employee_id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      let learningQuery = supabase
        .from('learning_updates')
        .select('employee_id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      let attendanceQuery = supabase
        .from('attendance')
        .select('employee_id, check_in, check_out, date')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (selectedEmployee !== 'all') {
        workQuery = workQuery.eq('employee_id', selectedEmployee)
        learningQuery = learningQuery.eq('employee_id', selectedEmployee)
        attendanceQuery = attendanceQuery.eq('employee_id', selectedEmployee)
      }

      const [workResult, learningResult, attendanceResult] = await Promise.all([
        workQuery,
        learningQuery,
        attendanceQuery
      ])

      // Calculate stats per employee
      const employeeStats = {}

      employeesData?.forEach(emp => {
        const empWork = (workResult.data || []).filter(w => w.employee_id === emp.id)
        const empLearning = (learningResult.data || []).filter(l => l.employee_id === emp.id)
        const empAttendance = (attendanceResult.data || []).filter(a => a.employee_id === emp.id)

        // Calculate total hours worked
        let totalWorkHours = 0
        empAttendance.forEach(a => {
          if (a.check_in && a.check_out) {
            const diff = new Date(a.check_out) - new Date(a.check_in)
            totalWorkHours += diff / (1000 * 60 * 60)
          }
        })

        employeeStats[emp.id] = {
          name: emp.name,
          department: emp.department,
          workUpdates: empWork.length,
          learningUpdates: empLearning.length,
          attendanceDays: empAttendance.length,
          totalHours: Math.round(totalWorkHours * 10) / 10,
          productivity: Math.round((empWork.length + empLearning.length) / Math.max(empAttendance.length, 1) * 100) / 100
        }
      })

      // Calculate totals
      const totals = {
        totalEmployees: employeesData?.length || 0,
        totalWorkUpdates: (workResult.data || []).length,
        totalLearningUpdates: (learningResult.data || []).length,
        totalAttendance: (attendanceResult.data || []).length,
        avgProductivity: Object.values(employeeStats).reduce((sum, e) => sum + e.productivity, 0) / Math.max(Object.keys(employeeStats).length, 1)
      }

      setStats({ employees: employeeStats, totals })

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!stats.employees) return

    const headers = ['Name', 'Department', 'Work Updates', 'Learning Updates', 'Attendance Days', 'Total Hours', 'Productivity']
    const rows = Object.values(stats.employees).map(e => [
      e.name,
      e.department || 'N/A',
      e.workUpdates,
      e.learningUpdates,
      e.attendanceDays,
      e.totalHours,
      e.productivity
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `grofast-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isAdmin()) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-gray-400">Reports are only available to administrators.</p>
      </div>
    )
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
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
          <p className="text-gray-400 mt-1">Team productivity and attendance insights</p>
        </div>
        <button
          onClick={exportCSV}
          className="btn-secondary flex items-center gap-2"
        >
          <HiOutlineDownload className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <HiOutlineFilter className="w-5 h-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-500/20">
              <HiOutlineUserGroup className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totals?.totalEmployees || 0}</p>
              <p className="text-sm text-gray-400">Total Employees</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-work/20">
              <HiOutlineBriefcase className="w-6 h-6 text-work" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totals?.totalWorkUpdates || 0}</p>
              <p className="text-sm text-gray-400">Work Updates</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-learning/20">
              <HiOutlineAcademicCap className="w-6 h-6 text-learning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totals?.totalLearningUpdates || 0}</p>
              <p className="text-sm text-gray-400">Learning Updates</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <HiOutlineClock className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totals?.totalAttendance || 0}</p>
              <p className="text-sm text-gray-400">Attendance Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h3 className="font-semibold text-white">Employee Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-bg/50 text-left text-sm text-gray-400">
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium text-center">Work Updates</th>
                <th className="px-6 py-4 font-medium text-center">Learning</th>
                <th className="px-6 py-4 font-medium text-center">Attendance</th>
                <th className="px-6 py-4 font-medium text-center">Total Hours</th>
                <th className="px-6 py-4 font-medium text-center">Productivity</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.employees || {}).map(([id, emp]) => (
                <tr key={id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{emp.department || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-work font-medium">{emp.workUpdates}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-learning font-medium">{emp.learningUpdates}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-400 font-medium">{emp.attendanceDays}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-300">{emp.totalHours}h</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
                          style={{ width: `${Math.min(emp.productivity * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{emp.productivity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports
