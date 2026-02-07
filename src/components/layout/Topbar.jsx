import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineMenu
} from 'react-icons/hi'

const Topbar = ({ onMenuToggle }) => {
  const { employee } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)

  const [notifications] = useState([
    { id: 1, message: 'New task assigned to you', time: '5m ago', unread: true },
    { id: 2, message: 'Team meeting in 30 minutes', time: '25m ago', unread: true },
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCurrentGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
        {/* Left: Hamburger + Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden btn-icon"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {getCurrentGreeting()}, {employee?.name?.split(' ')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-400">{formatDate()}</p>
          </div>

          {/* Mobile: Just show name */}
          <p className="sm:hidden text-sm font-semibold text-gray-900">
            {employee?.name?.split(' ')[0] || 'User'}
          </p>
        </div>

        {/* Center: Search (hidden on small mobile) */}
        <div className="hidden md:block flex-1 max-w-sm mx-6">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-surface-100 border border-transparent rounded-xl text-sm text-gray-900
                         placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-primary-500/5
                         transition-all duration-200"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn-icon relative"
            >
              <HiOutlineBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 rounded-full text-[10px] text-white
                               flex items-center justify-center font-bold ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-float border border-gray-100 overflow-hidden animate-fade-in-down">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="badge-error text-[10px]">{unreadCount} new</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        notif.unread ? 'bg-primary-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.unread && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <Link to="/profile">
            <div className="avatar-sm shadow-xs cursor-pointer hover:ring-2 hover:ring-primary-200 transition-all">
              <span className="text-xs">{employee?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Topbar
