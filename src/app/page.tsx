import Link from 'next/link'
import { Calendar, Users, Award, BarChart3, Plus, Eye } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Event Manager</h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Professional Event Management
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
            Streamline your event planning with our comprehensive management system. 
            Create events, generate tickets, manage participants, and track everything in real-time.
          </p>
          <div className="flex justify-center space-x-4 animate-slide-up">
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Get Started</span>
            </Link>
            <Link href="/dashboard/events" className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold border border-gray-300 transition-all transform hover:scale-105 flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>View Events</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h3>
            <p className="text-lg text-gray-600">Everything you need to manage events professionally</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                title: "Event Management",
                description: "Create and manage events with detailed information, scheduling, and capacity control."
              },
              {
                icon: Users,
                title: "Participant Tracking",
                description: "Track registrations, manage attendee data, and monitor participation status."
              },
              {
                icon: Award,
                title: "Certificate Generation",
                description: "Automatically generate and distribute certificates to verified participants."
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Comprehensive reporting with registration stats and participant insights."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 animate-fade-in">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-xl mb-8 opacity-90">
              Access your admin dashboard and start creating amazing events today.
            </p>
            <Link href="/dashboard" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2025 Event Management System. Built with Next.js and MySQL.</p>
        </div>
      </footer>
    </div>
  )
}