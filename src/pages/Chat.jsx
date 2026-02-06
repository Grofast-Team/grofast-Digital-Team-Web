import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, subscribeToTable } from '../lib/supabase'
import {
  HiOutlineChat,
  HiOutlinePaperAirplane,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
  HiOutlineSearch
} from 'react-icons/hi'

const Chat = () => {
  const { employee } = useAuth()
  const [channels, setChannels] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchChannels()
  }, [employee])

  useEffect(() => {
    if (activeChannel) {
      fetchMessages()

      // Subscribe to realtime messages
      const unsubscribe = subscribeToTable(
        'messages',
        (payload) => {
          if (payload.new && payload.new.channel_id === activeChannel.id) {
            setMessages(prev => [...prev, payload.new])
            scrollToBottom()
          }
        },
        `channel_id=eq.${activeChannel.id}`
      )

      return () => unsubscribe()
    }
  }, [activeChannel])

  const fetchChannels = async () => {
    try {
      // Get or create a general channel
      let { data: channelsData, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!channelsData || channelsData.length === 0) {
        // Create default channels if none exist
        const defaultChannels = [
          { name: 'General', type: 'department' },
          { name: 'Announcements', type: 'department' }
        ]

        for (const ch of defaultChannels) {
          await supabase.from('channels').insert(ch)
        }

        const { data: newData } = await supabase
          .from('channels')
          .select('*')
          .order('created_at', { ascending: true })

        channelsData = newData
      }

      setChannels(channelsData || [])
      if (channelsData?.length > 0) {
        setActiveChannel(channelsData[0])
      }

    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!activeChannel) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:employees(id, name)
        `)
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
      scrollToBottom()

    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel || !employee) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: employee.id,
          channel_id: activeChannel.id,
          content: newMessage.trim()
        })

      if (error) throw error
      setNewMessage('')

    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOwnMessage = (message) => {
    return message.sender_id === employee?.id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex animate-fade-in">
      {/* Channels Sidebar */}
      <div className="w-64 glass-card rounded-r-none border-r-0 flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <h3 className="font-semibold text-white">Channels</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeChannel?.id === channel.id
                  ? 'bg-primary-500/20 text-white'
                  : 'text-gray-400 hover:bg-dark-border/50 hover:text-white'
              }`}
            >
              <span className="text-lg">#</span>
              <span>{channel.name}</span>
            </button>
          ))}
        </div>

        {/* Team Members (placeholder) */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <HiOutlineUserGroup className="w-4 h-4" />
            <span>Team Chat</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card rounded-l-none flex flex-col">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-gray-400">#</span>
                  {activeChannel.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Team channel for {activeChannel.name.toLowerCase()} discussions
                </p>
              </div>
              <button className="p-2 hover:bg-dark-border rounded-lg transition-colors">
                <HiOutlineSearch className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage(message) ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className={`max-w-[70%] ${isOwnMessage(message) ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {isOwnMessage(message) ? 'You' : message.sender?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage(message)
                          ? 'bg-primary-500 text-white rounded-tr-none'
                          : 'bg-dark-border text-gray-200 rounded-tl-none'
                      }`}>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <HiOutlineChat className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-dark-border">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors"
                >
                  <HiOutlinePhotograph className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}`}
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <HiOutlineChat className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
