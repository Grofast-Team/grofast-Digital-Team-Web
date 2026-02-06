import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineStar,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineBriefcase,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineGlobe
} from 'react-icons/hi'

const ClientOfMonth = () => {
  const { employee, isAdmin } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    is_client_of_month: false
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('is_client_of_month', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // If setting as client of month, remove from other clients first
      if (formData.is_client_of_month) {
        await supabase
          .from('clients')
          .update({ is_client_of_month: false })
          .eq('is_client_of_month', true)
      }

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ ...formData, created_by: employee.id })

        if (error) throw error
      }

      setShowModal(false)
      setEditingClient(null)
      resetForm()
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId)

      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const setAsClientOfMonth = async (clientId) => {
    try {
      // Remove from all other clients
      await supabase
        .from('clients')
        .update({ is_client_of_month: false })
        .eq('is_client_of_month', true)

      // Set this client as client of month
      const { error } = await supabase
        .from('clients')
        .update({ is_client_of_month: true })
        .eq('id', clientId)

      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Error setting client of month:', error)
    }
  }

  const openEditModal = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      description: client.description || '',
      is_client_of_month: client.is_client_of_month
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      website: '',
      description: '',
      is_client_of_month: false
    })
  }

  const clientOfMonth = clients.find(c => c.is_client_of_month)
  const otherClients = clients.filter(c => !c.is_client_of_month)

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
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-500">Manage clients and highlight Client of the Month</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => {
              resetForm()
              setEditingClient(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Client
          </button>
        )}
      </div>

      {/* Client of the Month */}
      {clientOfMonth && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineStar className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-yellow-700">Client of the Month</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-3xl font-bold">
                {clientOfMonth.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{clientOfMonth.name}</h3>
              <p className="text-gray-600">{clientOfMonth.company}</p>
              {clientOfMonth.description && (
                <p className="text-gray-500 mt-2">{clientOfMonth.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {clientOfMonth.email && (
                  <a href={`mailto:${clientOfMonth.email}`} className="flex items-center gap-1 text-gray-500 hover:text-primary-600">
                    <HiOutlineMail className="w-4 h-4" />
                    {clientOfMonth.email}
                  </a>
                )}
                {clientOfMonth.phone && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <HiOutlinePhone className="w-4 h-4" />
                    {clientOfMonth.phone}
                  </span>
                )}
                {clientOfMonth.website && (
                  <a href={clientOfMonth.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-primary-600">
                    <HiOutlineGlobe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
            {isAdmin() && (
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(clientOfMonth)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white rounded-lg"
                >
                  <HiOutlinePencil className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Clients */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Clients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherClients.map((client) => (
            <div key={client.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {client.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{client.company}</p>
                </div>
              </div>

              {client.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{client.description}</p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {isAdmin() && (
                  <>
                    <button
                      onClick={() => setAsClientOfMonth(client.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                    >
                      <HiOutlineStar className="w-4 h-4" />
                      Set as Client of Month
                    </button>
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="card p-8 text-center">
            <HiOutlineBriefcase className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No clients yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingClient(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input-field"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clientOfMonth"
                  checked={formData.is_client_of_month}
                  onChange={(e) => setFormData({ ...formData, is_client_of_month: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="clientOfMonth" className="text-sm text-gray-700">
                  Set as Client of the Month
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingClient(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingClient ? 'Update' : 'Add'} Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientOfMonth
