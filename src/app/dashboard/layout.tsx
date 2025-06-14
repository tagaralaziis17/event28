"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Calendar, Users, FileText, LogOut, Award, ArrowLeft } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Hide sidebar by default on first render
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  // Show back button if not on /dashboard
  const showBack = pathname !== "/dashboard"

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard/events")) return "Events"
    if (pathname.startsWith("/dashboard/participants")) return "Participants"
    if (pathname.startsWith("/dashboard/certificates")) return "Certificates"
    return "Dashboard"
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300" onClick={() => setSidebarOpen(false)}></div>
      )}
      {/* Sidebar */}
      <aside className={`fixed z-50 inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-100 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="text-xl font-bold gradient-text">Event Manager</span>
          <button className="p-2" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <nav className="mt-6 space-y-2 px-4">
          <Link href="/dashboard" className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors font-medium" onClick={() => setSidebarOpen(false)}>
            <Calendar className="h-5 w-5 mr-3 text-blue-600" /> Dashboard
          </Link>
          <Link href="/dashboard/events" className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors font-medium" onClick={() => setSidebarOpen(false)}>
            <FileText className="h-5 w-5 mr-3 text-purple-600" /> Events
          </Link>
          <Link href="/dashboard/participants" className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors font-medium" onClick={() => setSidebarOpen(false)}>
            <Users className="h-5 w-5 mr-3 text-green-600" /> Participants
          </Link>
          <Link href="/dashboard/certificates" className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors font-medium" onClick={() => setSidebarOpen(false)}>
            <Award className="h-5 w-5 mr-3 text-yellow-600" /> Certificates
          </Link>
          <Link href="/logout" className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 transition-colors font-medium" onClick={() => setSidebarOpen(false)}>
            <LogOut className="h-5 w-5 mr-3 text-red-600" /> Logout
          </Link>
        </nav>
      </aside>

      {/* Floating Sidebar Button */}
      {!sidebarOpen && (
        <button
          className="fixed z-30 bottom-6 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-7 w-7" />
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex flex-wrap items-center px-2 sm:px-4 py-2 sm:py-3 shadow-sm gap-2 w-full animate-fade-in">
          {/* Back button (mobile first) */}
          {showBack && (
            <button
              className="flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 mr-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => router.back()}
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          {/* Logo & Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold gradient-text whitespace-nowrap">Event Manager</span>
          </div>
          <span className="text-base sm:text-lg font-bold text-gray-900 ml-2 flex-1 truncate">{getPageTitle()}</span>
          {/* User avatar dummy */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold ml-2">
            U
          </div>
        </header>
        <main className="flex-1 p-2 sm:p-4 lg:p-8 w-full max-w-7xl mx-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
// .gradient-text sudah ada di globals.css 