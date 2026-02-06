import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineFilter
} from 'react-icons/hi'

const Activity = () => {
  const { employee } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('today')

  useEffect(() => {
    fetchActivities()
  }, [employee, dateRange])

  const fetchActivities = async () => {
    if (!employee) return

    try {
      let startDate, endDate
      const now = new Date()

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
          endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString()
          break
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
          endDate = new Date().toISOString()
          break
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30)).toISOString()
          endDate = new Date().toISOString()
          break
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
          endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString()
      }

      // Fetch work updates
      const { data: workData } = await supabase
        .from('work_updates')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Fetch learning updates
      const { data: learningData } = await supabase
        .from('learning_updates')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Fetch attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Combine and sort
      const combined = [
        ...(workData || []).map(w => ({ ...w, type: 'work', title: w.description })),
        ...(learningData || []).map(l => ({ ...l, type: 'learning', title: l.topic })),
        ...(attendanceData || []).map(a => ({
          ...a,
          type: 'attendance',
          title: a.check_out ? 'Checked out' : 'Checked in'
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setActivities(combined)

    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'work':
        return <HiOutlineBriefcase className="w-5 h-5 text-work" />
      case 'learning':
        return <HiOutlineAcademicCap className="w-5 h-5 text-learning" />
      case 'attendance':
        return <HiOutlineUserGroup className="w-5 h-5 text-green-400" />
      default:
        return <HiOutlineClock className="w-5 h-5 text-gray-400" />
    }
  }

  const getBgColor = (type) => {
    switch (type) {
      case 'work': return 'bg-work/20'
      case 'learning': return 'bg-learning/20'
      case 'attendance': return 'bg-green-500/20'
      default: return 'bg-gray-500/20'
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'work': return 'Work Update'
      case 'learning': return 'Learning'
      case 'attendance': return 'Attendance'
      default: return 'Activity'
    }
  }

  const filteredActivities = activities.filter(a =>
    filter === 'all' || a.type === filter
  )

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white">Activity Timeline</h2>
        <p className="text-gray-400 mt-1">Track all your work, learning, and attendance activities</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        {/* Type Filter */}
        <div className="flex gap-2">
          {['all', 'work', 'learning', 'attendance'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-bg text-gray-400 hover:text-white'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <HiOutlineFilter className="w-5 h-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card p-6">
        {filteredActivities.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-dark-border" />

            {/* Activities */}
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => {
                const { date, time } = formatDateTime(activity.created_at)
                return (
                  <div key={`${activity.type}-${activity.id}`} className="relative pl-14">
                    {/* Timeline dot */}
                    <div className={`absolute left-4 w-5 h-5 rounded-full ${getBgColor(activity.type)} flex items-center justify-center`}>
                      <div className="w-2 h-2 rounded-full bg-current" style={{
                        color: activity.type === 'work' ? '#3b82f6' :
                               activity.type === 'learning' ? '#a855f7' : '#22c55e'
                      }} />
                    </div>

                    {/* Content */}
                    <div className="p-4 bg-dark-bg/50 rounded-lg hover:bg-dark-border/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getBgColor(activity.type)}`}>
                            {getIcon(activity.type)}
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">
                              {getTypeLabel(activity.type)}
                            </span>
                            <p className="text-white">{activity.title}</p>
                            {activity.hour && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-dark-border rounded">
                                {activity.hour}
                              </span>
                            )}
                            {activity.notes && (
                              <p className="text-gray-400 text-sm mt-1">{activity.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-400">{date}</p>
                          <p className="text-gray-500">{time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <HiOutlineClock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No activities found</p>
            <p className="text-sm mt-1">Activities will appear here as you log them</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-work">
            {activities.filter(a => a.type === 'work').length}
          </p>
          <p className="text-sm text-gray-400">Work Updates</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-learning">
            {activities.filter(a => a.type === 'learning').length}
          </p>
          <p className="text-sm text-gray-400">Learning Sessions</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {activities.filter(a => a.type === 'attendance').length}
          </p>
          <p className="text-sm text-gray-400">Attendance Records</p>
        </div>
      </div>
    </div>
  )
}

export default Activity
