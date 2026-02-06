import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlinePhotograph
} from 'react-icons/hi'

const WorkUpdate = () => {
  const { employee } = useAuth()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    hour: '',
    description: '',
    file: null
  })

  // Hour slots for the dropdown
  const hourSlots = [
    '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
    '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
    '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'
  ]

  useEffect(() => {
    fetchUpdates()
  }, [employee])

  const fetchUpdates = async () => {
    if (!employee) return

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('work_updates')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUpdates(data || [])

    } catch (error) {
      console.error('Error fetching work updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employee || !formData.hour || !formData.description) return

    setSubmitting(true)

    try {
      let fileUrl = null

      // Upload file if present
      if (formData.file) {
        const fileName = `${employee.id}/${Date.now()}_${formData.file.name}`
        const { error: uploadError } = await supabase.storage
          .from('work-files')
          .upload(fileName, formData.file)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('work-files')
            .getPublicUrl(fileName)
          fileUrl = publicUrl
        }
      }

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('work_updates')
          .update({
            hour: formData.hour,
            description: formData.description,
            ...(fileUrl && { file_url: fileUrl })
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('work_updates')
          .insert({
            employee_id: employee.id,
            hour: formData.hour,
            description: formData.description,
            file_url: fileUrl
          })

        if (error) throw error
      }

      // Reset form
      setFormData({ hour: '', description: '', file: null })
      setShowForm(false)
      setEditingId(null)
      await fetchUpdates()

    } catch (error) {
      console.error('Error saving work update:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (update) => {
    setFormData({
      hour: update.hour,
      description: update.description,
      file: null
    })
    setEditingId(update.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this update?')) return

    try {
      const { error } = await supabase
        .from('work_updates')
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
          <h2 className="text-2xl font-bold text-white">Work Updates</h2>
          <p className="text-gray-400 mt-1">Log your hourly work progress</p>
        </div>
        <button
          onClick={() => {
            setFormData({ hour: '', description: '', file: null })
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add Update
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Work Update' : 'New Work Update'}
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Work Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you worked on during this hour..."
                rows={4}
                className="input-field resize-none"
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachment (Optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="input-field flex items-center gap-2 text-gray-400">
                    <HiOutlinePhotograph className="w-5 h-5" />
                    <span>{formData.file ? formData.file.name : 'Choose file...'}</span>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </label>
                {formData.file && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, file: null })}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
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

      {/* Today's Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Today's Work</h3>
          <span className="badge-info">{updates.length} hours logged</span>
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
                    <div className="p-3 rounded-lg bg-work/20">
                      <HiOutlineBriefcase className="w-5 h-5 text-work" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-400 bg-blue-500/20 rounded mb-2">
                        {update.hour}
                      </span>
                      <p className="text-white">{update.description}</p>
                      {update.file_url && (
                        <a
                          href={update.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 mt-2"
                        >
                          <HiOutlinePhotograph className="w-4 h-4" />
                          View Attachment
                        </a>
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
            <HiOutlineBriefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No work updates yet today</p>
            <p className="text-sm mt-1">Click "Add Update" to log your first hour</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Daily Progress</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-dark-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-work to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((updates.length / 8) * 100, 100)}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">{updates.length}/8 hours</span>
        </div>
      </div>
    </div>
  )
}

export default WorkUpdate
