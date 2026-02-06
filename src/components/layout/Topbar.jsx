import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineBell,
  HiOutlineSearch
} from 'react-icons/hi'

const Topbar = ({ title }) => {
  const { employee } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications] = useState([
    { id: 1, message: 'New task assigned', time: '5m ago', unread: true },
    { id: 2, message: 'Meeting in 30 minutes', time: '25m ago', unread: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  const unreadCount = notifications.filter(n => n.unread).length

  const getCurrentGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left Section - Title & Date */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{formatDate()}</p>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right Section - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Greeting */}
        <span className="text-sm text-gray-600 hidden md:block">
          {getCurrentGreeting()}, <span className="font-medium text-gray-900">{employee?.name?.split(' ')[0] || 'User'}</span>
        </span>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HiOutlineBell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        notification.unread ? 'bg-primary-50' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all shadow-red">
          <span className="text-white font-medium">
            {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Topbar
