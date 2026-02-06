import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineVideoCamera,
  HiOutlineClipboardList,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineUserGroup
} from 'react-icons/hi'

const Calendar = () => {
  const { employee, isAdmin } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [employees, setEmployees] = useState([])

  // Mention states
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const descriptionRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    meet_link: '',
    attendees: []
  })

  useEffect(() => {
    fetchEvents()
    fetchEmployees()
  }, [employee, currentDate])

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name, email')
        .eq('is_active', true)

      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchEvents = async () => {
    if (!employee) return

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      // Fetch meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*, attendees')
        .gte('datetime', startOfMonth.toISOString())
        .lte('datetime', endOfMonth.toISOString())

      // Fetch tasks with due dates
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', employee.id)
        .gte('due_date', startOfMonth.toISOString().split('T')[0])
        .lte('due_date', endOfMonth.toISOString().split('T')[0])

      // Combine events
      const allEvents = [
        ...(meetingsData || []).map(m => ({
          ...m,
          type: 'meeting',
          date: new Date(m.datetime).toISOString().split('T')[0],
          time: new Date(m.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        })),
        ...(tasksData || []).map(t => ({
          ...t,
          type: 'task',
          date: t.due_date,
          time: null
        }))
      ]

      setEvents(allEvents)

    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('meetings')
        .insert({
          title: formData.title,
          description: formData.description,
          datetime: formData.datetime,
          meet_link: formData.meet_link || null,
          attendees: formData.attendees,
          created_by: employee.id
        })

      if (error) throw error

      setShowModal(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error creating meeting:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      datetime: '',
      meet_link: '',
      attendees: []
    })
  }

  const handleDescriptionChange = (e) => {
    const value = e.target.value
    const position = e.target.selectionStart
    setFormData({ ...formData, description: value })
    setCursorPosition(position)

    // Check for @ mention
    const textBeforeCursor = value.substring(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Only show mentions if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase())
        setShowMentions(true)
        return
      }
    }
    setShowMentions(false)
  }

  const insertMention = (emp) => {
    const description = formData.description
    const textBeforeCursor = description.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = description.substring(cursorPosition)

    const newDescription =
      description.substring(0, lastAtIndex) +
      `@${emp.name} ` +
      textAfterCursor

    setFormData({
      ...formData,
      description: newDescription,
      attendees: [...new Set([...formData.attendees, emp.id])]
    })
    setShowMentions(false)

    // Focus back on textarea
    setTimeout(() => {
      descriptionRef.current?.focus()
    }, 0)
  }

  const removeAttendee = (empId) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter(id => id !== empId)
    })
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(mentionSearch) ||
    emp.email.toLowerCase().includes(mentionSearch)
  )

  const getAttendeeNames = (attendeeIds) => {
    if (!attendeeIds || !Array.isArray(attendeeIds)) return []
    return attendeeIds.map(id => {
      const emp = employees.find(e => e.id === id)
      return emp?.name || 'Unknown'
    })
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getEventsForDate = (day) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const formatDateFull = (day) => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const days = getDaysInMonth()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500">View meetings, tasks, and deadlines</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Meeting
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HiOutlineChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day)
              return (
                <div
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  className={`min-h-[80px] p-2 rounded-lg border transition-all cursor-pointer ${
                    day
                      ? selectedDate === day
                        ? 'bg-primary-50 border-primary-500'
                        : isToday(day)
                        ? 'bg-primary-50/50 border-primary-200'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-medium ${
                        isToday(day) ? 'text-primary-600' : 'text-gray-700'
                      }`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${
                                event.type === 'meeting'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate ? formatDateFull(selectedDate) : 'Select a date'}
          </h3>

          {selectedDate ? (
            <div className="space-y-4">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        event.type === 'meeting' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {event.type === 'meeting' ? (
                          <HiOutlineVideoCamera className="w-5 h-5 text-purple-600" />
                        ) : (
                          <HiOutlineClipboardList className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {event.time && (
                          <p className="text-sm text-gray-500">{event.time}</p>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        {event.type === 'meeting' && event.attendees?.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <HiOutlineUserGroup className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {getAttendeeNames(event.attendees).join(', ')}
                            </span>
                          </div>
                        )}
                        {event.type === 'meeting' && event.meet_link && (
                          <a
                            href={event.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700"
                          >
                            Join Meeting
                          </a>
                        )}
                        {event.type === 'task' && (
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                            event.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : event.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {event.status?.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiOutlineCalendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No events on this day</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HiOutlineCalendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Click on a date to see events</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Meeting</h3>
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
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

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

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (use @mention to add attendees)
                </label>
                <textarea
                  ref={descriptionRef}
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  className="input-field"
                  rows={3}
                  placeholder="Type @ to mention team members..."
                />

                {/* Mention Dropdown */}
                {showMentions && filteredEmployees.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => insertMention(emp)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {emp.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Attendees */}
              {formData.attendees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendees
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.attendees.map((id) => {
                      const emp = employees.find(e => e.id === id)
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {emp?.name || 'Unknown'}
                          <button
                            type="button"
                            onClick={() => removeAttendee(id)}
                            className="hover:text-primary-900"
                          >
                            <HiOutlineX className="w-4 h-4" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.meet_link}
                  onChange={(e) => setFormData({ ...formData, meet_link: e.target.value })}
                  className="input-field"
                  placeholder="https://meet.google.com/..."
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
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
