import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineLightBulb
} from 'react-icons/hi'

const LearningUpdate = () => {
  const { employee } = useAuth()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    hour: '',
    topic: '',
    notes: ''
  })

  // Hour slots for the dropdown
  const hourSlots = [
    '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
    '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
    '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'
  ]

  // Learning categories
  const categories = [
    'Digital Marketing', 'SEO', 'Social Media', 'Content Writing',
    'Graphic Design', 'Video Editing', 'Web Development', 'Analytics',
    'Client Communication', 'Project Management', 'Tools & Software', 'Other'
  ]

  useEffect(() => {
    fetchUpdates()
  }, [employee])

  const fetchUpdates = async () => {
    if (!employee) return

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('learning_updates')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUpdates(data || [])

    } catch (error) {
      console.error('Error fetching learning updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employee || !formData.hour || !formData.topic) return

    setSubmitting(true)

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('learning_updates')
          .update({
            hour: formData.hour,
            topic: formData.topic,
            notes: formData.notes
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('learning_updates')
          .insert({
            employee_id: employee.id,
            hour: formData.hour,
            topic: formData.topic,
            notes: formData.notes
          })

        if (error) throw error
      }

      // Reset form
      setFormData({ hour: '', topic: '', notes: '' })
      setShowForm(false)
      setEditingId(null)
      await fetchUpdates()

    } catch (error) {
      console.error('Error saving learning update:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (update) => {
    setFormData({
      hour: update.hour,
      topic: update.topic,
      notes: update.notes || ''
    })
    setEditingId(update.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this update?')) return

    try {
      const { error } = await supabase
        .from('learning_updates')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchUpdates()

    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete. Please try again.')
    }
  }

  const getUsedHours = () => {
    return updates.map(u => u.hour)
  }

  const getAvailableHours = () => {
    const used = getUsedHours()
    return hourSlots.filter(h => !used.includes(h) || (editingId && formData.hour === h))
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
          <h2 className="text-2xl font-bold text-white">Learning Updates</h2>
          <p className="text-gray-400 mt-1">Track your daily learning progress</p>
        </div>
        <button
          onClick={() => {
            setFormData({ hour: '', topic: '', notes: '' })
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add Learning
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Learning Update' : 'New Learning Update'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hour Slot */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hour Slot *
              </label>
              <select
                value={formData.hour}
                onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select hour slot</option>
                {getAvailableHours().map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Topic Learned *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="What did you learn?"
                className="input-field"
                required
              />
              {/* Quick category tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, topic: cat })}
                    className="px-3 py-1 text-xs bg-dark-bg hover:bg-dark-border text-gray-400 hover:text-white rounded-full transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Key takeaways, resources used, etc..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Saving...' : (editingId ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Learning */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Today's Learning</h3>
          <span className="badge bg-purple-500/20 text-purple-400">
            {updates.length} hours learned
          </span>
        </div>

        {updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="p-4 bg-dark-bg/50 rounded-lg hover:bg-dark-border/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-learning/20">
                      <HiOutlineAcademicCap className="w-5 h-5 text-learning" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-medium text-purple-400 bg-purple-500/20 rounded mb-2">
                        {update.hour}
                      </span>
                      <p className="text-white font-medium">{update.topic}</p>
                      {update.notes && (
                        <p className="text-gray-400 text-sm mt-1">{update.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(update.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(update)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(update.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <HiOutlineLightBulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No learning logged yet today</p>
            <p className="text-sm mt-1">Click "Add Learning" to track what you've learned</p>
          </div>
        )}
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress */}
        <div className="glass-card p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Daily Learning Goal</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-learning to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((updates.length / 2) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">{updates.length}/2 hours</span>
          </div>
        </div>

        {/* Tips */}
        <div className="glass-card p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Learning Tip</h4>
          <p className="text-sm text-gray-300">
            Consistent daily learning, even for just 1-2 hours, leads to significant skill growth over time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LearningUpdate
