import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineViewGrid,
  HiOutlineStar,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineBell
} from 'react-icons/hi'

const Sidebar = () => {
  const { employee, signOut, isAdmin } = useAuth()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HiOutlineViewGrid },
    { name: 'Client of Month', path: '/client-of-month', icon: HiOutlineStar },
    { name: 'Tasks', path: '/tasks', icon: HiOutlineClipboardList },
    { name: 'Team Details', path: '/team', icon: HiOutlineUserGroup },
    { name: 'Leave Approval', path: '/leaves', icon: HiOutlineDocumentText, adminOnly: true },
    { name: 'Calendar', path: '/calendar', icon: HiOutlineCalendar },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-red">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">GROFAST</h1>
            <p className="text-xs text-gray-500">Team Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Skip admin-only items for non-admins
          if (item.adminOnly && !isAdmin()) return null

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}

        {/* Employee-only: My Leave Requests */}
        {!isAdmin() && (
          <NavLink
            to="/my-leaves"
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <HiOutlineDocumentText className="w-5 h-5" />
            <span>My Leaves</span>
          </NavLink>
        )}
      </nav>

      {/* User Profile & Settings */}
      <div className="p-4 border-t border-gray-200">
        {/* User Info - Clickable Profile Link */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'bg-primary-50 ring-2 ring-primary-200' : 'bg-gray-50 hover:bg-gray-100'
            }`
          }
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-medium">
              {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {employee?.name || 'User'}
            </p>
            <p className="text-xs text-primary-600 font-medium truncate">
              {employee?.role === 'admin' ? 'Administrator' : 'Employee'}
            </p>
          </div>
        </NavLink>

        {/* Settings & Logout */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? 'nav-item-active' : 'nav-item'
          }
        >
          <HiOutlineCog className="w-5 h-5 text-gray-500" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleSignOut}
          className="nav-item w-full text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <HiOutlineLogout className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
