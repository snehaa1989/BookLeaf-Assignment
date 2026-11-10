
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BookOpen,
  IndianRupee,
  ShoppingBag,
  Wallet,
  LogOut,
  LoaderCircle,
  AlertCircle,
  Ticket,
  PlusCircle,
  Sparkles,
  Send,
  MessageCircle,
} from 'lucide-react'
import './AuthorDashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface Book {
  id: string
  title: string
  isbn: string | null
  genre: string | null
  publication_date: string | null
  status: string
  mrp: number | null
  author_royalty_per_copy: number | null
  total_copies_sold: number
  total_royalty_earned: number
  royalty_paid: number
  royalty_pending: number
  last_royalty_payout_date: string | null
  print_partner: string | null
  available_on: string[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  city?: string | null
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
}

interface TicketMessage {
  id: number
  ticket_id: number
  sender_id: string
  body: string
  created_at: string
}

interface Props {
  onLogout: () => void
}

function AuthorDashboard({ onLogout }: Props) {
  const [books, setBooks] = useState<Book[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<TicketItem[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ticketLoading, setTicketLoading] = useState(true)
  const [ticketError, setTicketError] = useState('')
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [ticketSuccess, setTicketSuccess] = useState('')

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [selectedBook, setSelectedBook] = useState('')

  // Conversation states
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [conversationError, setConversationError] = useState('')

  const token = localStorage.getItem('access_token')

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  // Fetch support tickets
  const fetchTickets = async () => {
    setTicketLoading(true)
    setTicketError('')

    try {
      const response = await axios.get(
        `${API_URL}/api/tickets/`,
        { headers }
      )

      setTickets(response.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setTicketError(
          err.response?.status === 401
            ? 'Your session has expired. Please sign in again.'
            : 'Unable to load support tickets. Please try again.'
        )
      } else {
        setTicketError('Something went wrong while loading tickets.')
      }
    } finally {
      setTicketLoading(false)
    }
  }

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [booksResponse, userResponse] = await Promise.all([
          axios.get(`${API_URL}/api/books/my-books`, { headers }),
          axios.get(`${API_URL}/api/auth/me`, { headers }),
        ])

        setBooks(booksResponse.data)
        setUser(userResponse.data)
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError('Your session has expired. Please sign in again.')
          } else {
            setError('Unable to load your dashboard. Please try again.')
          }
        } else {
          setError('Something went wrong while loading your dashboard.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
    fetchTickets()
  }, [])

  // Create support ticket
  const handleCreateTicket = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setTicketError('')
    setTicketSuccess('')

    if (!subject.trim() || !description.trim()) {
      setTicketError('Please enter both a subject and description.')
      return
    }

    setCreatingTicket(true)

    try {
      const payload = {
        subject: subject.trim(),
        description: description.trim(),
        book_id: selectedBook || null,
      }

      const response = await axios.post(
        `${API_URL}/api/tickets/`,
        payload,
        { headers }
      )

      setTickets((previousTickets) => [
        response.data,
        ...previousTickets,
      ])

      setSubject('')
      setDescription('')
      setSelectedBook('')

      setTicketSuccess(
        `Ticket #${response.data.id} created successfully!`
      )
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setTicketError(
          typeof detail === 'string'
            ? detail
            : 'Unable to create your ticket. Please try again.'
        )
      } else {
        setTicketError('Something went wrong while creating your ticket.')
      }
    } finally {
      setCreatingTicket(false)
    }
  }

  // Fetch messages for a ticket
  const fetchMessages = async (ticketId: number) => {
    setMessagesLoading(true)
    setConversationError('')

    try {
      const response = await axios.get(
        `${API_URL}/api/tickets/${ticketId}/messages`,
        { headers }
      )

      setMessages(response.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setConversationError(
          err.response?.data?.detail ||
          'Unable to load conversation. Please try again.'
        )
      } else {
        setConversationError(
          'Something went wrong while loading messages.'
        )
      }
    } finally {
      setMessagesLoading(false)
    }
  }

  // Open or close a ticket conversation
  const handleOpenConversation = async (ticketId: number) => {
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null)
      setMessages([])
      setMessageDraft('')
      setConversationError('')
      return
    }

    setSelectedTicketId(ticketId)
    setMessages([])
    setMessageDraft('')
    setConversationError('')

    await fetchMessages(ticketId)
  }

  // Send a reply
  const handleSendMessage = async (
    e: React.FormEvent<HTMLFormElement>,
    ticketId: number
  ) => {
    e.preventDefault()

    const body = messageDraft.trim()

    if (!body) {
      return
    }

    setSendingMessage(true)
    setConversationError('')

    try {
      const response = await axios.post(
        `${API_URL}/api/tickets/${ticketId}/messages`,
        { body },
        { headers }
      )

      setMessages((previousMessages) => [
        ...previousMessages,
        response.data,
      ])

      setMessageDraft('')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setConversationError(
          err.response?.data?.detail ||
          'Unable to send your message. Please try again.'
        )
      } else {
        setConversationError(
          'Something went wrong while sending your message.'
        )
      }
    } finally {
      setSendingMessage(false)
    }
  }

  // Dashboard calculations
  const totalBooks = books.length

  const totalCopiesSold = books.reduce(
    (sum, book) => sum + book.total_copies_sold, 0
  )

  const totalEarned = books.reduce(
    (sum, book) => sum + book.total_royalty_earned, 0
  )

  const totalPending = books.reduce(
    (sum, book) => sum + book.royalty_pending, 0
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const formatMessageDate = (date: string) =>
    new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getPriorityClass = (priority: string) =>
    priority.toLowerCase()

  const getStatusClass = (status: string) =>
    status.toLowerCase().replace(/\s+/g, '-')

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoaderCircle className="loading-icon" size={32} />
        <p>Preparing your author dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={28} />
        <p>{error}</p>
        <button onClick={onLogout}>Sign in again</button>
      </div>
    )
  }

  return (
    <main className="author-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <BookOpen size={27} />
          <span>BookLeaf</span>
        </div>

        <button className="dashboard-logout" onClick={onLogout}>
          <LogOut size={17} />
          Sign out
        </button>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">AUTHOR PORTAL</span>
            <h1>Hello, {user?.name || 'Author'}!</h1>
            <p>Here's an overview of your books and earnings.</p>
          </div>

          <div className="author-profile">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <section className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon books-icon">
              <BookOpen size={21} />
            </div>
            <span>Total Books</span>
            <strong>{totalBooks}</strong>
            <small>Books in your account</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon sales-icon">
              <ShoppingBag size={21} />
            </div>
            <span>Copies Sold</span>
            <strong>{totalCopiesSold.toLocaleString('en-IN')}</strong>
            <small>Total copies sold</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon earned-icon">
              <IndianRupee size={21} />
            </div>
            <span>Total Royalties</span>
            <strong>{formatCurrency(totalEarned)}</strong>
            <small>Total royalty earned</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending-icon">
              <Wallet size={21} />
            </div>
            <span>Pending Royalties</span>
            <strong>{formatCurrency(totalPending)}</strong>
            <small>Awaiting payout</small>
          </div>
        </section>

        {/* My Books */}
        <section className="books-section">
          <div className="section-heading">
            <div>
              <h2>My Books</h2>
              <p>Manage and track your published titles.</p>
            </div>
            <span className="book-count">{totalBooks} books</span>
          </div>

          {books.length === 0 ? (
            <div className="empty-books">
              <BookOpen size={35} />
              <h3>No books found</h3>
              <p>
                Your books will appear here once they are added to your account.
              </p>
            </div>
          ) : (
            <div className="books-table-wrapper">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Status</th>
                    <th>Copies Sold</th>
                    <th>Royalty Earned</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <strong>{book.title}</strong>
                        <span>{book.genre || 'Genre not specified'}</span>
                      </td>
                      <td>
                        <span className="book-status">
                          {book.status}
                        </span>
                      </td>
                      <td>{book.total_copies_sold}</td>
                      <td>{formatCurrency(book.total_royalty_earned)}</td>
                      <td>{formatCurrency(book.royalty_pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Support Tickets */}
        <section className="support-section">
          <div className="support-section-heading">
            <div>
              <span className="dashboard-eyebrow">WE'RE HERE TO HELP</span>
              <h2>Support Center</h2>
              <p>Raise a concern and track assistance from BookLeaf.</p>
            </div>

            <div className="support-heading-icon">
              <Ticket size={25} />
            </div>
          </div>

          {/* Create Ticket Form */}
          <div className="create-ticket-card">
            <div className="ticket-card-heading">
              <div>
                <h3>Create a Support Ticket</h3>
                <p>Tell us what you need help with.</p>
              </div>
              <PlusCircle size={22} />
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="ticket-form-group">
                <label htmlFor="ticket-subject">Subject</label>
                <input
                  id="ticket-subject"
                  type="text"
                  placeholder="e.g. Royalty payment clarification"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="ticket-form-group">
                <label htmlFor="ticket-book">
                  Related book <span>(Optional)</span>
                </label>
                <select
                  id="ticket-book"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                >
                  <option value="">Select a book</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ticket-form-group">
                <label htmlFor="ticket-description">Description</label>
                <textarea
                  id="ticket-description"
                  rows={4}
                  placeholder="Describe your concern in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {ticketError && (
                <div className="ticket-alert ticket-alert-error" role="alert">
                  <AlertCircle size={17} />
                  {ticketError}
                </div>
              )}

              {ticketSuccess && (
                <div className="ticket-alert ticket-alert-success" role="status">
                  <Sparkles size={17} />
                  {ticketSuccess}
                </div>
              )}

              <button
                type="submit"
                className="create-ticket-button"
                disabled={creatingTicket}
              >
                {creatingTicket ? (
                  <>
                    <LoaderCircle className="loading-icon" size={17} />
                    Creating ticket...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Submit Ticket
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Ticket List */}
          <div className="ticket-list-card">
            <div className="ticket-card-heading">
              <div>
                <h3>My Support Tickets</h3>
                <p>Track the progress of your support requests.</p>
              </div>

              <button
                className="refresh-tickets-button"
                onClick={fetchTickets}
                disabled={ticketLoading}
                type="button"
              >
                {ticketLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {ticketLoading ? (
              <div className="ticket-empty-state">
                <LoaderCircle className="loading-icon" size={25} />
                <p>Loading your tickets...</p>
              </div>
            ) : ticketError ? (
              <div className="ticket-empty-state ticket-error-state">
                <AlertCircle size={25} />
                <p>{ticketError}</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="ticket-empty-state">
                <Ticket size={34} />
                <h3>No support tickets yet</h3>
                <p>
                  If you need help, create your first ticket using the form above.
                </p>
              </div>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <article className="ticket-item" key={ticket.id}>
                    <div className="ticket-item-top">
                      <div>
                        <span className="ticket-reference">
                          TICKET #{ticket.id}
                        </span>
                        <h4>{ticket.subject}</h4>
                      </div>

                      <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="ticket-description">
                      {ticket.description}
                    </p>

                    <div className="ticket-metadata">
                      <span>
                        <strong>Category:</strong> {ticket.category}
                      </span>
                      <span className={`ticket-priority ${getPriorityClass(ticket.priority)}`}>
                        <strong>Priority:</strong> {ticket.priority}
                      </span>
                      <span>
                        <strong>Created:</strong> {formatDate(ticket.created_at)}
                      </span>
                    </div>

                    {(ticket.ai_reasoning || ticket.ai_draft) && (
                      <div className="ai-analysis">
                        <div className="ai-analysis-heading">
                          <Sparkles size={17} />
                          AI Support Assistant
                        </div>

                        {ticket.ai_reasoning && (
                          <div className="ai-analysis-content">
                            <strong>Classification reasoning</strong>
                            <p>{ticket.ai_reasoning}</p>
                          </div>
                        )}

                        {ticket.ai_draft && (
                          <div className="ai-analysis-content">
                            <strong>Suggested response</strong>
                            <p>{ticket.ai_draft}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conversation Toggle */}
                    <div className="conversation-actions">
                      <button
                        type="button"
                        className="conversation-toggle-button"
                        onClick={() => handleOpenConversation(ticket.id)}
                      >
                        <MessageCircle size={17} />
                        {selectedTicketId === ticket.id
                          ? 'Close Conversation'
                          : 'View Conversation'}
                      </button>
                    </div>

                    {/* Conversation Panel */}
                    {selectedTicketId === ticket.id && (
                      <div className="conversation-panel">
                        <div className="conversation-heading">
                          <div>
                            <h4>Ticket Conversation</h4>
                            <p>Ticket #{ticket.id}</p>
                          </div>
                          <MessageCircle size={21} />
                        </div>

                        {messagesLoading ? (
                          <div className="conversation-empty">
                            <LoaderCircle className="loading-icon" size={24} />
                            <p>Loading conversation...</p>
                          </div>
                        ) : (
                          <>
                            <div className="message-list">
                              {messages.length === 0 ? (
                                <div className="conversation-empty">
                                  <MessageCircle size={28} />
                                  <p>No messages yet. Start the conversation!</p>
                                </div>
                              ) : (
                                messages.map((message) => {
                                  const isAuthor =
                                    message.sender_id === user?.id

                                  return (
                                    <div
                                      key={message.id}
                                      className={`message-row ${
                                        isAuthor
                                          ? 'author-message-row'
                                          : 'support-message-row'
                                      }`}
                                    >
                                      <div
                                        className={`message-bubble ${
                                          isAuthor
                                            ? 'author-message'
                                            : 'support-message'
                                        }`}
                                      >
                                        <span className="message-sender">
                                          {isAuthor
                                            ? 'You'
                                            : 'BookLeaf Support'}
                                        </span>

                                        <p>{message.body}</p>

                                        <span className="message-time">
                                          {formatMessageDate(message.created_at)}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>

                            <form
                              className="conversation-reply-form"
                              onSubmit={(e) =>
                                handleSendMessage(e, ticket.id)
                              }
                            >
                              <textarea
                                rows={2}
                                placeholder="Write your reply..."
                                value={messageDraft}
                                onChange={(e) =>
                                  setMessageDraft(e.target.value)
                                }
                                required
                              />

                              <button
                                type="submit"
                                disabled={
                                  sendingMessage || !messageDraft.trim()
                                }
                              >
                                {sendingMessage ? (
                                  <LoaderCircle
                                    className="loading-icon"
                                    size={17}
                                  />
                                ) : (
                                  <Send size={17} />
                                )}
                                {sendingMessage
                                  ? 'Sending...'
                                  : 'Send Reply'}
                              </button>
                            </form>
                          </>
                        )}

                        {conversationError && (
                          <div
                            className="ticket-alert ticket-alert-error"
                            role="alert"
                          >
                            <AlertCircle size={17} />
                            {conversationError}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default AuthorDashboard
