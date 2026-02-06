import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineVideoCamera,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineExternalLink
} from 'react-icons/hi'

const Meetings = () => {
  const { employee, isAdmin } = useAuth()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    meet_link: '',
    attendees: []
  })

  useEffect(() => {
    fetchMeetings()
    fetchEmployees()
  }, [employee])

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(id, name)
        `)
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true })

      if (error) throw error
      setMeetings(data || [])

    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name, department')
        .eq('status', 'active')

      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employee || !formData.title || !formData.datetime) return

    setSubmitting(true)

    try {
      // Generate Google Meet link (placeholder - in production, use Google Calendar API)
      const meetLink = formData.meet_link || `https://meet.google.com/${generateMeetCode()}`

      const { error } = await supabase
        .from('meetings')
        .insert({
          title: formData.title,
          datetime: new Date(formData.datetime).toISOString(),
          meet_link: meetLink,
          created_by: employee.id,
          attendees: formData.attendees
        })

      if (error) throw error

      setFormData({ title: '', datetime: '', meet_link: '', attendees: [] })
      setShowForm(false)
      await fetchMeetings()

    } catch (error) {
      console.error('Error creating meeting:', error)
      alert('Failed to create meeting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const generateMeetCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    let code = ''
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      if (i < 2) code += '-'
    }
    return code
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const isUpcoming = (datetime) => {
    const meetingTime = new Date(datetime)
    const now = new Date()
    const diff = meetingTime - now
    return diff > 0 && diff < 30 * 60 * 1000 // Within 30 minutes
  }

  const toggleAttendee = (id) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter(a => a !== id)
        : [...prev.attendees, id]
    }))
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
          <h2 className="text-2xl font-bold text-white">Meetings</h2>
          <p className="text-gray-400 mt-1">Schedule and join team meetings</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Meeting
        </button>
      </div>

      {/* Create Meeting Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Schedule New Meeting</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter meeting title"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Meet Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.meet_link}
                  onChange={(e) => setFormData({ ...formData, meet_link: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="input-field"
                />
              </div>
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attendees
              </label>
              <div className="flex flex-wrap gap-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleAttendee(emp.id)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      formData.attendees.includes(emp.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-bg text-gray-400 hover:text-white'
                    }`}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Creating...' : 'Create Meeting'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Meetings */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Meetings</h3>

        {meetings.length > 0 ? (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const { date, time } = formatDateTime(meeting.datetime)
              const upcoming = isUpcoming(meeting.datetime)

              return (
                <div
                  key={meeting.id}
                  className={`p-4 rounded-lg transition-colors ${
                    upcoming
                      ? 'bg-meetings/10 border border-meetings/30'
                      : 'bg-dark-bg/50 hover:bg-dark-border/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        upcoming ? 'bg-meetings/20' : 'bg-dark-border'
                      }`}>
                        <HiOutlineVideoCamera className={`w-6 h-6 ${
                          upcoming ? 'text-meetings' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{meeting.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <HiOutlineCalendar className="w-4 h-4" />
                            {date}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="w-4 h-4" />
                            {time}
                          </span>
                          {meeting.attendees?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <HiOutlineUsers className="w-4 h-4" />
                              {meeting.attendees.length} attendees
                            </span>
                          )}
                        </div>
                        {meeting.creator && (
                          <p className="text-xs text-gray-500 mt-1">
                            Created by {meeting.creator.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <a
                      href={meeting.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        upcoming
                          ? 'bg-meetings text-white hover:bg-meetings/80'
                          : 'bg-dark-border text-gray-300 hover:text-white'
                      }`}
                    >
                      <HiOutlineExternalLink className="w-4 h-4" />
                      {upcoming ? 'Join Now' : 'Join'}
                    </a>
                  </div>

                  {upcoming && (
                    <div className="mt-3 pt-3 border-t border-meetings/20">
                      <span className="text-sm text-meetings animate-pulse">
                        Starting soon!
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <HiOutlineVideoCamera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No upcoming meetings</p>
            <p className="text-sm mt-1">Click "New Meeting" to schedule one</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Meetings
