import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineCog,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineKey,
  HiOutlineBell,
  HiOutlineShieldCheck
} from 'react-icons/hi'

const Settings = () => {
  const { employee, refreshEmployee } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: ''
  })

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    taskReminders: true,
    meetingReminders: true
  })

  useEffect(() => {
    if (employee) {
      setProfileData({
        name: employee.name || '',
        email: employee.email || '',
        department: employee.department || ''
      })
    }
  }, [employee])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: profileData.name,
          department: profileData.department
        })
        .eq('id', employee.id)

      if (error) throw error

      await refreshEmployee()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })

    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match!' })
      setLoading(false)
      return
    }

    if (passwordData.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error

      setPasswordData({ current: '', new: '', confirm: '' })
      setMessage({ type: 'success', text: 'Password changed successfully!' })

    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary-500/20">
            <HiOutlineUser className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Profile Information</h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={profileData.email}
                disabled
                className="input-field pl-12 opacity-60 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact admin for assistance.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Department
            </label>
            <input
              type="text"
              value={profileData.department}
              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <HiOutlineKey className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              className="input-field"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              className="input-field"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <HiOutlineBell className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
            { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
            { key: 'taskReminders', label: 'Task Reminders', desc: 'Get reminded about upcoming tasks' },
            { key: 'meetingReminders', label: 'Meeting Reminders', desc: 'Get reminded before meetings' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-primary-500' : 'bg-dark-border'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications[item.key] ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-500/20">
            <HiOutlineShieldCheck className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Account</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-dark-border">
            <span className="text-gray-400">Role</span>
            <span className="text-white capitalize">{employee?.role || 'Team Member'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-border">
            <span className="text-gray-400">Status</span>
            <span className="badge-success">{employee?.status || 'Active'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Member Since</span>
            <span className="text-white">
              {employee?.created_at
                ? new Date(employee.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
