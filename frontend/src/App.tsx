
import { useState } from 'react'
import axios from 'axios'
import {
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import AuthorDashboard from './AuthorDashboard'
import AdminDashboard from './AdminDashboard'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState(
    localStorage.getItem('role') || ''
  )

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append('username', email.trim())
      formData.append('password', password)

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('role', response.data.role)

      setUserRole(response.data.role)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Incorrect email or password. Please try again.')
        } else {
          setError(
            err.response?.data?.detail ||
            'Unable to connect to the server. Please try again.'
          )
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('role')

    setUserRole('')
    setEmail('')
    setPassword('')
    setError('')
  }

  // Author Dashboard
  if (userRole === 'author') {
    return <AuthorDashboard onLogout={handleLogout} />
  }

  // Admin Dashboard
  if (userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />
  }

  // Login Page
  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="visual-content">
          <div className="brand">
            <div className="brand-icon">
              <BookOpen size={27} />
            </div>
            <span>BookLeaf</span>
          </div>

          <div className="visual-message">
            <span className="eyebrow">YOUR STORY. OUR SUPPORT.</span>

            <h1>
              Every author
              <br />
              deserves a
              <br />
              <span>better journey.</span>
            </h1>

            <p>
              One place to manage your books, track royalties,
              and connect with the BookLeaf support team.
            </p>

            <div className="visual-decoration">
              <div className="book-decoration book-one">
                <BookOpen size={30} />
              </div>
              <div className="book-decoration book-two">
                <BookOpen size={25} />
              </div>
              <div className="book-decoration book-three">
                <BookOpen size={22} />
              </div>
            </div>
          </div>

          <div className="visual-footer">
            <span>Made for storytellers.</span>
            <span>© 2026 BookLeaf</span>
          </div>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <div className="mobile-brand">
            <div className="brand-icon">
              <BookOpen size={25} />
            </div>
            <span>BookLeaf</span>
          </div>

          <div className="form-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Enter your credentials to access your BookLeaf portal.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="form-bottom">
            <ShieldCheck size={17} />
            <span>
              Your account is protected with secure authentication.
            </span>
          </div>

          <p className="support-text">
            Need help accessing your account? Contact BookLeaf support.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
