
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import axios from 'axios'
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Search,
  RefreshCw,
  LogOut,
  LoaderCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  CircleAlert,
  Ticket,
  Filter,
  Send,
  X,
  StickyNote,
} from 'lucide-react'
import './AdminDashboard.css'

const API_URL = 'http://127.0.0.1:8000'

const TICKET_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
]

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

interface TicketItem {
  id: number
  author_id: string
  book_id: string | null
  subject: string
  description: string
  category: string
  priority: string
  status: string
  ai_reasoning: string | null
  ai_draft: string | null
  created_at: string
  updated_at: string
  assigned_admin_id?: number | null
}

interface TicketMessage {
  id: number
  ticket_id: number
  sender_id: string
  body: string
  created_at: string
}

interface InternalNote {
  id: number
  ticket_id: number
  admin_id: string
  body: string
  created_at: string
}

interface DashboardStats {
  total_tickets: number
  status_counts: Record<string, number>
  priority_counts: Record<string, number>
  category_counts: Record<string, number>
}

interface AdminDashboardProps {
  onLogout: () => void
}

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  // Selected ticket and conversation state
  const [selectedTicket, setSelectedTicket] =
    useState<TicketItem | null>(null)

  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [messageDraft, setMessageDraft] = useState('')
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [noteDraft, setNoteDraft] = useState('')

  const [detailLoading, setDetailLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingCategory, setUpdatingCategory] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [assigningTicket, setAssigningTicket] = useState(false)

  const [detailError, setDetailError] = useState('')
  const [messageSuccess, setMessageSuccess] = useState('')
  const [noteSuccess, setNoteSuccess] = useState('')

  const token = localStorage.getItem('access_token')

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  })

  // Fetch admin dashboard information
  const fetchDashboardData = async () => {
    if (!token) {
      setError('Your session has expired. Please log in again.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const [userResponse, ticketResponse, statsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/auth/me`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_URL}/api/tickets/`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_URL}/api/tickets/admin/dashboard`, {
            headers: getHeaders(),
          }),
        ])

      setUser(userResponse.data)
      setTickets(ticketResponse.data)
      setStats(statsResponse.data)
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            'Unable to load the admin dashboard. Please try again.',
        )
      } else {
        setError('Something went wrong while loading the dashboard.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Search and filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        ticket.subject.toLowerCase().includes(search) ||
        ticket.description.toLowerCase().includes(search) ||
        ticket.category.toLowerCase().includes(search) ||
        String(ticket.id).includes(search) ||
        ticket.author_id.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === 'All' || ticket.status === statusFilter

      const matchesPriority =
        priorityFilter === 'All' || ticket.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, searchTerm, statusFilter, priorityFilter])

  const getCount = (status: string) => {
    return stats?.status_counts?.[status] ?? 0
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'status-open'
      case 'in progress':
        return 'status-progress'
      case 'resolved':
        return 'status-resolved'
      case 'closed':
        return 'status-closed'
      default:
        return ''
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'priority-critical'
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  // Open a ticket and load its conversation
  const openTicket = async (ticket: TicketItem) => {
    setSelectedTicket(ticket)
    setMessages([])
    setNotes([])
    setDetailError('')
    setMessageSuccess('')
    setNoteSuccess('')
    setMessageDraft('')
    setNoteDraft('')
    setDetailLoading(true)

    try {
      const [ticketResponse, messagesResponse, notesResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/tickets/${ticket.id}`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_URL}/api/tickets/${ticket.id}/messages`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_URL}/api/tickets/${ticket.id}/notes`, {
            headers: getHeaders(),
          }),
        ])

      setSelectedTicket(ticketResponse.data)
      setMessages(messagesResponse.data)
      setNotes(notesResponse.data)
    } catch (err) {
      console.error('Failed to load ticket details:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to load ticket details. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while loading this ticket.')
      }
    } finally {
      setDetailLoading(false)
    }
  }

  // Refresh ticket details and messages
  const refreshConversation = async () => {
    if (!selectedTicket) return

    try {
      setDetailError('')

      const [ticketResponse, messagesResponse, notesResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/tickets/${selectedTicket.id}`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_URL}/api/tickets/${selectedTicket.id}/messages`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_URL}/api/tickets/${selectedTicket.id}/notes`, {
            headers: getHeaders(),
          }),
        ])

      setSelectedTicket(ticketResponse.data)
      setMessages(messagesResponse.data)
      setNotes(notesResponse.data)

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === ticketResponse.data.id
            ? ticketResponse.data
            : ticket,
        ),
      )
    } catch (err) {
      console.error('Failed to refresh conversation:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to refresh the conversation.',
        )
      } else {
        setDetailError('Unable to refresh the conversation.')
      }
    }
  }

  // Update ticket status (admin-only endpoint)
  const updateTicketStatus = async (newStatus: string) => {
    if (!selectedTicket || newStatus === selectedTicket.status) return

    try {
      setUpdatingStatus(true)
      setDetailError('')
      setMessageSuccess('')

      const response = await axios.patch(
        `${API_URL}/api/tickets/${selectedTicket.id}/status`,
        { status: newStatus },
        { headers: getHeaders() },
      )

      setSelectedTicket(response.data)
      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === response.data.id ? response.data : ticket,
        ),
      )

      const statsResponse = await axios.get(
        `${API_URL}/api/tickets/admin/dashboard`,
        { headers: getHeaders() },
      )
      setStats(statsResponse.data)
      setMessageSuccess(`Ticket status updated to ${newStatus}.`)
    } catch (err) {
      console.error('Failed to update ticket status:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to update ticket status. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while updating the status.')
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Update ticket category (admin-only endpoint)
  const updateTicketCategory = async (newCategory: string) => {
    if (!selectedTicket || newCategory === selectedTicket.category) return

    try {
      setUpdatingCategory(true)
      setDetailError('')
      setMessageSuccess('')

      const response = await axios.patch(
        `${API_URL}/api/tickets/${selectedTicket.id}/category`,
        { category: newCategory },
        { headers: getHeaders() },
      )

      setSelectedTicket(response.data)
      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === response.data.id ? response.data : ticket,
        ),
      )

      const statsResponse = await axios.get(
        `${API_URL}/api/tickets/admin/dashboard`,
        { headers: getHeaders() },
      )
      setStats(statsResponse.data)
      setMessageSuccess(`Ticket category updated to ${newCategory}.`)
    } catch (err) {
      console.error('Failed to update ticket category:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to update ticket category. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while updating the category.')
      }
    } finally {
      setUpdatingCategory(false)
    }
  }

  // Update ticket priority (admin-only endpoint)
  const updateTicketPriority = async (newPriority: string) => {
    if (!selectedTicket || newPriority === selectedTicket.priority) return

    try {
      setUpdatingPriority(true)
      setDetailError('')
      setMessageSuccess('')

      const response = await axios.patch(
        `${API_URL}/api/tickets/${selectedTicket.id}/priority`,
        { priority: newPriority },
        { headers: getHeaders() },
      )

      setSelectedTicket(response.data)
      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === response.data.id ? response.data : ticket,
        ),
      )

      const statsResponse = await axios.get(
        `${API_URL}/api/tickets/admin/dashboard`,
        { headers: getHeaders() },
      )
      setStats(statsResponse.data)
      setMessageSuccess(`Ticket priority updated to ${newPriority}.`)
    } catch (err) {
      console.error('Failed to update ticket priority:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to update ticket priority. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while updating the priority.')
      }
    } finally {
      setUpdatingPriority(false)
    }
  }

  // Assign the selected ticket to the currently logged-in admin
  const assignTicketToMe = async () => {
    if (!selectedTicket || !user || assigningTicket) return

    if (String(selectedTicket.assigned_admin_id) === String(user.id)) return

    try {
      setAssigningTicket(true)
      setDetailError('')
      setMessageSuccess('')

      const response = await axios.patch(
        `${API_URL}/api/tickets/${selectedTicket.id}/assign-to-me`,
        {},
        { headers: getHeaders() },
      )

      setSelectedTicket(response.data)
      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === response.data.id ? response.data : ticket,
        ),
      )

      setMessageSuccess('Ticket successfully assigned to you.')
    } catch (err) {
      console.error('Failed to assign ticket:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to assign this ticket. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while assigning the ticket.')
      }
    } finally {
      setAssigningTicket(false)
    }
  }

  // Save a private internal note (not visible to the author)
  const saveInternalNote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedTicket || !noteDraft.trim()) return

    try {
      setSavingNote(true)
      setDetailError('')
      setNoteSuccess('')

      await axios.post(
        `${API_URL}/api/tickets/${selectedTicket.id}/notes`,
        { body: noteDraft.trim() },
        { headers: getHeaders() },
      )

      setNoteDraft('')
      setNoteSuccess('Private note added successfully.')

      const notesResponse = await axios.get(
        `${API_URL}/api/tickets/${selectedTicket.id}/notes`,
        { headers: getHeaders() },
      )
      setNotes(notesResponse.data)
    } catch (err) {
      console.error('Failed to save internal note:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to save the private note. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while saving the private note.')
      }
    } finally {
      setSavingNote(false)
    }
  }

  // Send an admin reply to the author
  const sendAdminReply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedTicket || !messageDraft.trim()) return

    try {
      setSendingMessage(true)
      setDetailError('')
      setMessageSuccess('')

      await axios.post(
        `${API_URL}/api/tickets/${selectedTicket.id}/messages`,
        {
          body: messageDraft.trim(),
        },
        {
          headers: getHeaders(),
        },
      )

      setMessageDraft('')
      setMessageSuccess('Your reply was sent successfully.')

      await refreshConversation()
    } catch (err) {
      console.error('Failed to send admin reply:', err)

      if (axios.isAxiosError(err)) {
        setDetailError(
          err.response?.data?.detail ||
            'Unable to send your reply. Please try again.',
        )
      } else {
        setDetailError('Something went wrong while sending your reply.')
      }
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <LoaderCircle size={32} className="spin" />
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <h2>BookLeaf</h2>
            <span>Support Portal</span>
          </div>
        </div>

        <div className="admin-sidebar-label">WORKSPACE</div>

        <div className="admin-nav-item active">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </div>

        <div className="admin-nav-item">
          <MessageSquare size={18} />
          <span>Support Tickets</span>
          <span className="admin-nav-count">{tickets.length}</span>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="admin-profile-info">
              <strong>{user?.name || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="admin-logout-button" onClick={onLogout}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">Workspace / Dashboard</p>
            <h1>Support Dashboard</h1>
            <p className="admin-welcome">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}.
              Here's your support overview.
            </p>
          </div>

          <button
            className="admin-refresh-button"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="admin-error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={fetchDashboardData}>Retry</button>
          </div>
        )}

        {/* Dashboard statistics */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon total">
              <Ticket size={21} />
            </div>
            <div>
              <p>Total Tickets</p>
              <h2>{stats?.total_tickets ?? tickets.length}</h2>
              <span>All support requests</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon open">
              <CircleAlert size={21} />
            </div>
            <div>
              <p>Open Tickets</p>
              <h2>{getCount('Open')}</h2>
              <span>Awaiting attention</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon progress">
              <Clock size={21} />
            </div>
            <div>
              <p>In Progress</p>
              <h2>{getCount('In Progress')}</h2>
              <span>Currently being handled</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon resolved">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <p>Resolved</p>
              <h2>{getCount('Resolved')}</h2>
              <span>Successfully resolved</span>
            </div>
          </div>
        </section>

        {/* Support tickets */}
        <section className="admin-ticket-section">
          <div className="admin-section-heading">
            <div>
              <h2>Support Tickets</h2>
              <p>Review and manage author support requests.</p>
            </div>

            <span className="admin-ticket-total">
              {filteredTickets.length} tickets
            </span>
          </div>

          {/* Search and filters */}
          <div className="admin-filters">
            <div className="admin-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search tickets, subjects, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-filter-control">
              <Filter size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="admin-filter-control">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Ticket table */}
          <div className="admin-ticket-table-wrapper">
            <table className="admin-ticket-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div className="admin-ticket-title">
                        <strong>{ticket.subject}</strong>
                        <span>
                          #{ticket.id} · Author ID: {ticket.author_id}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="admin-category">
                        {ticket.category}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-priority ${getPriorityClass(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-status ${getStatusClass(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="admin-date">
                      {formatDate(ticket.created_at)}
                    </td>

                    <td>
                      <button
                        className="admin-view-button"
                        onClick={() => openTicket(ticket)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty-state">
                        <MessageSquare size={28} />
                        <strong>No tickets found</strong>
                        <p>
                          Try changing your search or filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Ticket details and conversation modal */}
      {selectedTicket && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="admin-ticket-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="admin-modal-eyebrow">
                  SUPPORT TICKET #{selectedTicket.id}
                </span>

                <h2>{selectedTicket.subject}</h2>

                <p>
                  Created on {formatDate(selectedTicket.created_at)}
                </p>
              </div>

              <button
                className="admin-modal-close"
                onClick={() => setSelectedTicket(null)}
                aria-label="Close ticket details"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="admin-detail-loading">
                <LoaderCircle size={28} className="spin" />
                <p>Loading ticket conversation...</p>
              </div>
            ) : (
              <div className="admin-modal-content">
                {detailError && (
                  <div className="admin-error">
                    <AlertCircle size={17} />
                    <span>{detailError}</span>
                    <button onClick={refreshConversation}>Retry</button>
                  </div>
                )}

                {/* Ticket information */}
                <section className="admin-detail-section">
                  <h3>Ticket Information</h3>

                  <div className="admin-detail-grid">
                    <div>
                      <span>Author ID</span>
                      <strong>{selectedTicket.author_id}</strong>
                    </div>

                    <div className="admin-assignment-field">
                      <span>Assigned Admin</span>
                      <strong>
                        {selectedTicket.assigned_admin_id == null
                          ? 'Unassigned'
                          : String(selectedTicket.assigned_admin_id) === String(user?.id)
                            ? 'You'
                            : `Admin #${selectedTicket.assigned_admin_id}`}
                      </strong>
                      <button
                        type="button"
                        className="admin-assign-button"
                        onClick={assignTicketToMe}
                        disabled={
                          assigningTicket ||
                          String(selectedTicket.assigned_admin_id) === String(user?.id)
                        }
                      >
                        {assigningTicket
                          ? 'Assigning...'
                          : String(selectedTicket.assigned_admin_id) === String(user?.id)
                            ? 'Assigned to you'
                            : 'Assign to me'}
                      </button>
                    </div>

                    <div>
                      <span>Book ID</span>
                      <strong>
                        {selectedTicket.book_id || 'Not specified'}
                      </strong>
                    </div>

                    <div>
                      <span>Category</span>
                      <select
                        className="admin-category-select"
                        value={selectedTicket.category}
                        onChange={(e) => updateTicketCategory(e.target.value)}
                        disabled={updatingCategory}
                        aria-label="Update ticket category"
                      >
                        {TICKET_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {updatingCategory && (
                        <small className="admin-inline-status">
                          Updating category...
                        </small>
                      )}
                    </div>

                    <div>
                      <span>Priority</span>
                      <select
                        className="admin-priority-select"
                        value={selectedTicket.priority}
                        onChange={(e) => updateTicketPriority(e.target.value)}
                        disabled={updatingPriority}
                        aria-label="Update ticket priority"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      {updatingPriority && (
                        <small className="admin-inline-status">
                          Updating priority...
                        </small>
                      )}
                    </div>

                    <div>
                      <span>Status</span>
                      <select
                        className="admin-status-select"
                        value={selectedTicket.status}
                        onChange={(e) => updateTicketStatus(e.target.value)}
                        disabled={updatingStatus}
                        aria-label="Update ticket status"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                      {updatingStatus && (
                        <small className="admin-inline-status">
                          Updating status...
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="admin-ticket-description">
                    <h4>Author's Description</h4>
                    <p>{selectedTicket.description}</p>
                  </div>
                </section>

                {/* AI classification and suggested response */}
                {(selectedTicket.ai_reasoning ||
                  selectedTicket.ai_draft) && (
                  <section className="admin-ai-section">
                    <h3>
                      <span>✦</span> AI Support Analysis
                    </h3>

                    {selectedTicket.ai_reasoning && (
                      <div className="admin-ai-block">
                        <strong>Classification Reasoning</strong>
                        <p>{selectedTicket.ai_reasoning}</p>
                      </div>
                    )}

                    {selectedTicket.ai_draft && (
                      <div className="admin-ai-block">
                        <strong>Suggested Response</strong>
                        <p>{selectedTicket.ai_draft}</p>
                      </div>
                    )}
                  </section>
                )}

                {/* Private internal notes - admin only */}
                <section className="admin-notes-section">
                  <div className="admin-notes-heading">
                    <div>
                      <h3>
                        <StickyNote size={18} />
                        Internal Notes
                      </h3>
                      <p>Private notes visible only to support administrators.</p>
                    </div>
                    <span className="admin-private-label">Admin only</span>
                  </div>

                  <div className="admin-notes-list">
                    {notes.map((note) => (
                      <article className="admin-note-card" key={note.id}>
                        <div className="admin-note-meta">
                          <strong>Support team</strong>
                          <span>{formatMessageTime(note.created_at)}</span>
                        </div>
                        <p>{note.body}</p>
                      </article>
                    ))}

                    {notes.length === 0 && (
                      <div className="admin-notes-empty">
                        No internal notes have been added to this ticket.
                      </div>
                    )}
                  </div>

                  {noteSuccess && (
                    <div className="admin-message-success">
                      <CheckCircle2 size={16} />
                      {noteSuccess}
                    </div>
                  )}

                  <form className="admin-note-form" onSubmit={saveInternalNote}>
                    <textarea
                      placeholder="Add a private note for the support team..."
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={3}
                      required
                    />
                    <div className="admin-note-footer">
                      <span>This note will not be shared with the author.</span>
                      <button
                        type="submit"
                        disabled={savingNote || !noteDraft.trim()}
                      >
                        {savingNote ? (
                          <LoaderCircle size={16} className="spin" />
                        ) : (
                          <StickyNote size={16} />
                        )}
                        {savingNote ? 'Saving...' : 'Add Private Note'}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Conversation */}
                <section className="admin-conversation-section">
                  <div className="admin-conversation-heading">
                    <div>
                      <h3>Conversation</h3>
                      <p>
                        {messages.length} message
                        {messages.length === 1 ? '' : 's'}
                      </p>
                    </div>

                    <button
                      className="admin-refresh-button"
                      onClick={refreshConversation}
                    >
                      <RefreshCw size={15} />
                      Refresh
                    </button>
                  </div>

                  <div className="admin-message-list">
                    {messages.map((message) => {
                      const isAdminMessage =
                        message.sender_id === user?.id

                      return (
                        <div
                          key={message.id}
                          className={`admin-message-row ${
                            isAdminMessage
                              ? 'admin-own-message-row'
                              : 'admin-author-message-row'
                          }`}
                        >
                          <div
                            className={`admin-message-bubble ${
                              isAdminMessage
                                ? 'admin-own-message'
                                : 'admin-author-message'
                            }`}
                          >
                            <div className="admin-message-meta">
                              <strong>
                                {isAdminMessage
                                  ? 'You (Support)'
                                  : 'Author'}
                              </strong>

                              <span>
                                {formatMessageTime(message.created_at)}
                              </span>
                            </div>

                            <p>{message.body}</p>
                          </div>
                        </div>
                      )
                    })}

                    {messages.length === 0 && (
                      <div className="admin-conversation-empty">
                        <MessageSquare size={26} />
                        <p>No messages yet.</p>
                        <span>
                          Send a reply to start the conversation.
                        </span>
                      </div>
                    )}
                  </div>

                  {messageSuccess && (
                    <div className="admin-message-success">
                      <CheckCircle2 size={16} />
                      {messageSuccess}
                    </div>
                  )}

                  {/* Admin reply form */}
                  <form
                    className="admin-reply-form"
                    onSubmit={sendAdminReply}
                  >
                    <textarea
                      placeholder="Write your reply to the author..."
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      rows={3}
                      required
                    />

                    <div className="admin-reply-footer">
                      <span>
                        Replies are visible to the author.
                      </span>

                      <button
                        type="submit"
                        disabled={
                          sendingMessage || !messageDraft.trim()
                        }
                      >
                        {sendingMessage ? (
                          <LoaderCircle size={16} className="spin" />
                        ) : (
                          <Send size={16} />
                        )}

                        {sendingMessage ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
