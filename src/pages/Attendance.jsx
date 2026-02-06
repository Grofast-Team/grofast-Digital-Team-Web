import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  HiOutlineClock,
  HiOutlineCamera,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from 'react-icons/hi'

const Attendance = () => {
  const { employee } = useAuth()
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selfieMode, setSelfieMode] = useState(false)
  const [selfieUrl, setSelfieUrl] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)

  useEffect(() => {
    fetchAttendanceData()
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [employee])

  const fetchAttendanceData = async () => {
    if (!employee) return

    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch today's attendance
      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .single()

      setTodayAttendance(todayData)

      // Fetch attendance history (last 7 days)
      const { data: historyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .order('date', { ascending: false })
        .limit(7)

      setHistory(historyData || [])

    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setSelfieMode(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please allow camera permissions.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext('2d')
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8)
    setSelfieUrl(dataUrl)

    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setSelfieMode(false)
  }

  const cancelSelfie = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setSelfieMode(false)
    setSelfieUrl(null)
  }

  const handleCheckIn = async () => {
    if (!employee) return
    setSubmitting(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      let imageUrl = null

      // Upload selfie if taken
      if (selfieUrl) {
        const blob = await fetch(selfieUrl).then(r => r.blob())
        const fileName = `${employee.id}/${today}_checkin.jpg`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(fileName, blob, { upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('attendance-photos')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      const { error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          check_in: now,
          date: today,
          image_url: imageUrl
        })

      if (error) throw error

      await fetchAttendanceData()
      setSelfieUrl(null)
      alert('Checked in successfully!')

    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (!employee || !todayAttendance) return
    setSubmitting(true)

    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('attendance')
        .update({ check_out: now })
        .eq('id', todayAttendance.id)

      if (error) throw error

      await fetchAttendanceData()
      alert('Checked out successfully!')

    } catch (error) {
      console.error('Error checking out:', error)
      alert('Failed to check out. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (isoString) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    const diff = new Date(checkOut) - new Date(checkIn)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
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
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white">Attendance</h2>
        <p className="text-gray-400 mt-1">Mark your daily check-in and check-out</p>
      </div>

      {/* Check-in/Check-out Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-xl bg-primary-500/20">
            <HiOutlineClock className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Today's Attendance</h3>
            <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Status */}
        {todayAttendance ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-bg/50 rounded-lg">
                <p className="text-sm text-gray-400">Check In</p>
                <p className="text-xl font-semibold text-green-400">
                  {formatTime(todayAttendance.check_in)}
                </p>
              </div>
              <div className="p-4 bg-dark-bg/50 rounded-lg">
                <p className="text-sm text-gray-400">Check Out</p>
                <p className="text-xl font-semibold text-blue-400">
                  {formatTime(todayAttendance.check_out)}
                </p>
              </div>
            </div>

            {!todayAttendance.check_out && (
              <button
                onClick={handleCheckOut}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? 'Processing...' : (
                  <>
                    <HiOutlineXCircle className="w-5 h-5" />
                    Check Out
                  </>
                )}
              </button>
            )}

            {todayAttendance.check_out && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <HiOutlineCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-medium">Attendance Complete</p>
                <p className="text-sm text-gray-400 mt-1">
                  Total: {calculateHours(todayAttendance.check_in, todayAttendance.check_out)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selfie Capture */}
            {selfieMode ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-sm mx-auto rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-4">
                  <button onClick={capturePhoto} className="btn-primary flex-1">
                    <HiOutlineCamera className="w-5 h-5 inline mr-2" />
                    Capture
                  </button>
                  <button onClick={cancelSelfie} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            ) : selfieUrl ? (
              <div className="space-y-4">
                <img src={selfieUrl} alt="Selfie" className="w-full max-w-sm mx-auto rounded-lg" />
                <div className="flex gap-4">
                  <button onClick={() => setSelfieUrl(null)} className="btn-secondary flex-1">
                    Retake
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={submitting}
                    className="btn-primary flex-1"
                  >
                    {submitting ? 'Processing...' : 'Confirm Check In'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-gray-400">
                  Take a selfie to verify your check-in (optional)
                </p>
                <div className="flex gap-4">
                  <button onClick={startCamera} className="btn-secondary flex-1">
                    <HiOutlineCamera className="w-5 h-5 inline mr-2" />
                    Take Selfie
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={submitting}
                    className="btn-primary flex-1"
                  >
                    {submitting ? 'Processing...' : (
                      <>
                        <HiOutlineCheckCircle className="w-5 h-5 inline mr-2" />
                        Check In
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-dark-border">
                <th className="pb-3">Date</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="border-b border-dark-border/50">
                    <td className="py-4 text-white">{formatDate(record.date)}</td>
                    <td className="py-4 text-gray-300">{formatTime(record.check_in)}</td>
                    <td className="py-4 text-gray-300">{formatTime(record.check_out)}</td>
                    <td className="py-4 text-gray-300">
                      {calculateHours(record.check_in, record.check_out)}
                    </td>
                    <td className="py-4">
                      {record.check_out ? (
                        <span className="badge-success">Complete</span>
                      ) : (
                        <span className="badge-warning">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No attendance records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Attendance
