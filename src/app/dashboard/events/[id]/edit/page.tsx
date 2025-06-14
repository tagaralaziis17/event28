'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, ArrowLeft, Upload, Loader2, X } from 'lucide-react'

interface EventData {
  id: number
  name: string
  slug: string
  type: string
  location: string
  description: string
  start_time: string
  end_time: string
  quota: number
  ticket_design?: string
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'Seminar',
    location: '',
    description: '',
    startTime: '',
    endTime: '',
    quota: '',
  })

  useEffect(() => {
    fetchEventData()
  }, [params.id])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const event = data.event
        
        setFormData({
          name: event.name,
          slug: event.slug,
          type: event.type,
          location: event.location,
          description: event.description || '',
          startTime: new Date(event.start_time).toISOString().slice(0, 16),
          endTime: new Date(event.end_time).toISOString().slice(0, 16),
          quota: event.quota.toString(),
        })

        if (event.ticket_design) {
          setPreviewUrl(event.ticket_design)
        }
      } else {
        alert('Failed to load event data')
        router.push('/dashboard/events')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      alert('Failed to load event data')
      router.push('/dashboard/events')
    } finally {
      setFetchLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    // Reset file input
    const fileInput = document.getElementById('ticketDesign') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const form = new FormData()
      
      // Add all form fields
      form.append('name', formData.name)
      form.append('slug', formData.slug)
      form.append('type', formData.type)
      form.append('location', formData.location)
      form.append('description', formData.description)
      form.append('startTime', formData.startTime)
      form.append('endTime', formData.endTime)
      form.append('quota', formData.quota)
      
      // Add file if selected
      if (selectedFile) {
        form.append('ticketDesign', selectedFile)
      }
      
      const response = await fetch(`/api/events/${params.id}`, {
        method: 'PUT',
        body: form,
      })

      if (response.ok) {
        router.push(`/dashboard/events/${params.id}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }
      
      // Auto-generate slug when name changes
      if (name === 'name') {
        newData.slug = generateSlug(value)
      }
      
      return newData
    })
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">Event Manager</h1>
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link href={`/dashboard/events/${params.id}`} className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Event</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Edit Event</h2>
          <p className="text-gray-600">Update event details and settings</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter event name"
              />
            </div>

            {/* Event Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Event Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                placeholder="event-slug-url"
              />
              <p className="text-sm text-gray-500 mt-1">URL-friendly version of the event name</p>
            </div>

            {/* Event Type and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                >
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Training">Training</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter event location"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter event description"
              ></textarea>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Quota */}
            <div>
              <label htmlFor="quota" className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Quota *
              </label>
              <input
                type="number"
                id="quota"
                name="quota"
                value={formData.quota}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter number of tickets"
              />
            </div>

            {/* Ticket Design Upload */}
            <div>
              <label htmlFor="ticketDesign" className="block text-sm font-medium text-gray-700 mb-2">
                E-Ticket Design <span className="text-gray-400">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-1">Upload a PNG, JPG, or GIF up to 10MB. Recommended size: 1280x720px.</p>
              {!previewUrl ? (
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-blue-50/30">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-blue-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="ticketDesign" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          id="ticketDesign"
                          name="ticketDesign"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 border-2 border-blue-300 border-dashed rounded-lg p-4 bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile ? selectedFile.name : 'Current ticket design'}
                        </p>
                        {selectedFile && (
                          <p className="text-sm text-gray-500">
                            {Math.round(selectedFile.size / 1024)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <label htmlFor="ticketDesign" className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Change
                        <input
                          id="ticketDesign"
                          name="ticketDesign"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link 
                href={`/dashboard/events/${params.id}`}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{loading ? 'Updating...' : 'Update Event'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}