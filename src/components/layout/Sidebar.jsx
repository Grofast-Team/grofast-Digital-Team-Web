import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineViewGrid,
  HiOutlineStar,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineVideoCamera,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineX
} from 'react-icons/hi'

const Sidebar = ({ isOpen, onClose }) => {
  const { employee, signOut, isAdmin } = useAuth()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HiOutlineViewGrid },
    { name: 'Client of Month', path: '/client-of-month', icon: HiOutlineStar },
    { name: 'Tasks', path: '/tasks', icon: HiOutlineClipboardList },
    { name: 'Team Details', path: '/team', icon: HiOutlineUserGroup },
    { name: 'Leave Approval', path: '/leaves', icon: HiOutlineDocumentText, adminOnly: true },
    { name: 'Meetings', path: '/meetings', icon: HiOutlineVideoCamera },
    { name: 'Calendar', path: '/calendar', icon: HiOutlineCalendar },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-[272px] bg-white border-r border-gray-100
      flex flex-col z-50 shadow-soft
      transition-transform duration-300 ease-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-red">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">GROFAST</h1>
              <p className="text-[10px] font-semibold text-primary-500 uppercase tracking-widest">Digital Team</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button onClick={onClose} className="lg:hidden btn-icon">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>

        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin()) return null

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}

        {/* Team member only: My Leaves */}
        {!isAdmin() && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal</p>
            <NavLink
              to="/my-leaves"
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              <HiOutlineDocumentText className="w-5 h-5 flex-shrink-0" />
              <span>My Leaves</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 ring-1 ring-primary-200'
                : 'hover:bg-gray-50'
            }`
          }
        >
          <div className="avatar-md shadow-soft">
            <span>{employee?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {employee?.name || 'User'}
            </p>
            <p className="text-xs font-medium text-primary-500 truncate">
              {employee?.role === 'admin' ? 'Administrator' : 'Team Member'}
            </p>
          </div>
        </NavLink>

        {/* Settings & Logout */}
        <div className="flex gap-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <HiOutlineCog className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                       text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <HiOutlineLogout className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
