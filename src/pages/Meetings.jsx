import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineVideoCamera,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineExternalLink,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineTrash
} from 'react-icons/hi'

const Meetings = () => {
  const { employee, isAdmin } = useAuth()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState([])
  const [editingMeeting, setEditingMeeting] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    meet_link: '',
    attendees: []
  })

  useEffect(() => {
    if (employee) {
      fetchMeetings()
      fetchEmployees()
    }
  }, [employee])

  const fetchMeetings = async () => {
    try {
      const [{ data: meetingsData, error: meetingsError }, { data: empData }] = await Promise.all([
        supabase
          .from('meetings')
          .select('*')
          .order('datetime', { ascending: true }),
        supabase.from('employees').select('id, name')
      ])

      if (meetingsError) throw meetingsError

      const empMap = {}
      empData?.forEach(emp => { empMap[emp.id] = emp })

      const meetingsWithCreator = (meetingsData || []).map(m => ({
        ...m,
        creator: empMap[m.created_by] || null
      }))

      setMeetings(meetingsWithCreator)
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

      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', datetime: '', meet_link: '', attendees: [] })
    setEditingMeeting(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employee || !formData.title || !formData.datetime) return

    setSubmitting(true)

    try {
      const meetLink = formData.meet_link || `https://meet.google.com/${generateMeetCode()}`

      if (editingMeeting) {
        const { error } = await supabase
          .from('meetings')
          .update({
            title: formData.title,
            datetime: new Date(formData.datetime).toISOString(),
            meet_link: meetLink,
            attendees: formData.attendees
          })
          .eq('id', editingMeeting.id)

        if (error) throw error
      } else {
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
      }

      resetForm()
      setShowForm(false)
      await fetchMeetings()
    } catch (error) {
      console.error('Error saving meeting:', error)
      alert('Failed to save meeting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditForm = (meeting) => {
    setEditingMeeting(meeting)
    const dt = new Date(meeting.datetime)
    const localDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    setFormData({
      title: meeting.title || '',
      datetime: localDt,
      meet_link: meeting.meet_link || '',
      attendees: meeting.attendees || []
    })
    setShowForm(true)
  }

  const handleDelete = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) throw error
      await fetchMeetings()
    } catch (error) {
      console.error('Error deleting meeting:', error)
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
    return diff > 0 && diff < 30 * 60 * 1000
  }

  const isPast = (datetime) => {
    return new Date(datetime) < new Date()
  }

  const toggleAttendee = (id) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter(a => a !== id)
        : [...prev.attendees, id]
    }))
  }

  const getAttendeeNames = (attendeeIds) => {
    if (!attendeeIds || !Array.isArray(attendeeIds)) return []
    return attendeeIds.map(id => {
      const emp = employees.find(e => e.id === id)
      return emp?.name || 'Unknown'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const upcomingMeetings = meetings.filter(m => !isPast(m.datetime))
  const pastMeetings = meetings.filter(m => isPast(m.datetime))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meetings</h2>
          <p className="text-gray-500 mt-1">Schedule and join team meetings</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Schedule Meeting
        </button>
      </div>

      {/* Create/Edit Meeting Form */}
      {showForm && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
            </h3>
            <button onClick={() => { setShowForm(false); resetForm() }} className="p-1 hover:bg-gray-100 rounded">
              <HiOutlineX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendees
              </label>
              <div className="flex flex-wrap gap-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleAttendee(emp.id)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors border ${
                      formData.attendees.includes(emp.id)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Saving...' : editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Meetings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h3>

        {upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => {
              const { date, time } = formatDateTime(meeting.datetime)
              const upcoming = isUpcoming(meeting.datetime)

              return (
                <div
                  key={meeting.id}
                  className={`p-4 rounded-lg transition-colors border ${
                    upcoming
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        upcoming ? 'bg-green-100' : 'bg-gray-200'
                      }`}>
                        <HiOutlineVideoCamera className={`w-6 h-6 ${
                          upcoming ? 'text-green-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
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
                        {meeting.attendees?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {getAttendeeNames(meeting.attendees).join(', ')}
                          </p>
                        )}
                        {meeting.creator && (
                          <p className="text-xs text-gray-400 mt-1">
                            Created by {meeting.creator.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          upcoming
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                      >
                        <HiOutlineExternalLink className="w-4 h-4" />
                        {upcoming ? 'Join Now' : 'Join'}
                      </a>
                      <button
                        onClick={() => openEditForm(meeting)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {upcoming && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <span className="text-sm text-green-600 animate-pulse font-medium">
                        Starting soon!
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <HiOutlineVideoCamera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-gray-500">No upcoming meetings</p>
            <p className="text-sm mt-1">Click "Schedule Meeting" to create one</p>
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Meetings</h3>
          <div className="space-y-3">
            {pastMeetings.map((meeting) => {
              const { date, time } = formatDateTime(meeting.datetime)
              return (
                <div
                  key={meeting.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200 opacity-75"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-gray-200">
                        <HiOutlineVideoCamera className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-600">{meeting.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <HiOutlineCalendar className="w-4 h-4" />
                            {date}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="w-4 h-4" />
                            {time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(meeting)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Meetings
