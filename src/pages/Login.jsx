import { useEffect, useState } from "react"
import axios from "axios"
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from "framer-motion"
import { Activity, ArrowRight, Loader2, Mail, Shield, Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Alert, AlertDescription } from "../components/ui/alert"

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"

const API_URL = import.meta.env.VITE_REACT_APP_API;

// Helper function to construct API paths
const apiPath = (path) => `${API_URL}${path}`;

function OrbitsBackground() {
  // Subtle motion rings and dots to match the landing motif without heavy gradients.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(255,255,255,0.05),rgba(0,0,0,0))]" />
      {/* Animated rings */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border border-orange-500/10" />
        <div className="absolute inset-6 rounded-full border border-orange-500/10" />
        <div className="absolute inset-12 rounded-full border border-orange-500/10" />
        <div className="absolute inset-20 rounded-full border border-orange-500/10" />
      </motion.div>

      {/* Floating accent dots */}
      {[
        { x: "15%", y: "30%", delay: 0 },
        { x: "75%", y: "20%", delay: 0.6 },
        { x: "65%", y: "70%", delay: 1.2 },
      ].map((d, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full bg-orange-500/70 shadow-[0_0_20px_4px_rgba(249,115,22,0.35)]"
          style={{ left: d.x, top: d.y }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, delay: d.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Check if user is already logged in by making a request to a protected endpoint
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(apiPath("/profile"), {
          withCredentials: true 
        })
        
        if (response.data && response.data.user) {
          // User is already logged in, redirect to dashboard
          const from = location.state?.from?.pathname || '/dashboard'
          navigate(from, { replace: true })
        }
      } catch (error) {
        // User is not authenticated or cookie expired, stay on login page
        console.log("User not authenticated")
      }
    }

    checkAuthStatus()
  }, [navigate, location])

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    
    try {
      const res = await axios.post(apiPath("/login"), formData, {
        withCredentials: true 
      })
      
      // Store user data in localStorage (but not the token - it's now in HTTP-only cookie)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(res?.data?.user))
      }
      
      setMessage(res?.data?.message || "Login successful!")
      
      // Redirect to dashboard or intended page
      const from = location.state?.from?.pathname || '/dashboard'
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 1000)
      
    } catch (err) {
      setMessage(err?.response?.data?.error || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true)
    setMessage("")
    try {
      const res = await axios.post(apiPath("/google-auth"), {
        credential: credentialResponse?.credential,
      }, {
        withCredentials: true // Important: include cookies in the request
      })
      
      // Store user data in localStorage (but not the token - it's now in HTTP-only cookie)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(res?.data?.user))
      }
      
      setMessage(`Welcome back ${res?.data?.user?.email || ""}!`)
      
      // Redirect to dashboard or intended page
      const from = location.state?.from?.pathname || '/dashboard'
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 1000)
      
    } catch (err) {
      setMessage(err?.response?.data?.error || "Google login failed.")
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleError() {
    setMessage("Google login failed.")
  }

  useEffect(() => {
    // Autofocus email input
    const el = document.getElementById("email")
    el?.focus()
  }, [])

  return (
    <main className="relative min-h-[100dvh] bg-[#0b0d12] text-white">
      <OrbitsBackground />
      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        {/* Left: Welcome back content */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <Shield className="h-3.5 w-3.5 text-orange-400" />
            <span>{"Welcome back"}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
            Sign in to your account
          </h1>
          <p className="max-w-lg text-zinc-300">
            Access your personalized dashboard with real-time crypto signals, AI insights, and portfolio analytics. 
            Your trading edge awaits.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-zinc-300">
              <Lock className="h-5 w-5 text-orange-400" />
              <span>{"Secure authentication"}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <Activity className="h-5 w-5 text-orange-400" />
              <span>{"Real-time access"}</span>
            </div>
          </div>

          {/* Subtle moving underline accent */}
          <motion.div
            className="h-px w-40 bg-orange-500/70"
            animate={{ width: ["8rem", "11rem", "8rem"] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        {/* Right: Login card */}
        <Card className="relative border-zinc-800 bg-zinc-950/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sign in</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className={`border-zinc-800 bg-zinc-900/60 ${message.includes('successful') || message.includes('Welcome') ? 'text-green-300' : 'text-zinc-200'}`}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-9 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-sm text-orange-400 hover:text-orange-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pr-10 text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-200"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {"Signing in..."}
                  </>
                ) : (
                  <>
                    {"Sign in"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="relative py-2">
                <Separator className="border-zinc-800" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 px-2 text-xs text-zinc-500">
                  or
                </span>
              </div>

              {/* Google Sign In */}
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <div className="flex w-full justify-center">
                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="w-full border-zinc-800 bg-transparent text-zinc-300"
                  title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
                >
                  {"Continue with Google (configure VITE_GOOGLE_CLIENT_ID)"}
                </Button>
              )}

              <p className="text-center text-sm text-zinc-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-orange-400 hover:text-orange-300">
                  Sign up
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-zinc-500">
        <p>{"By continuing, you agree to our Terms and Privacy Policy."}</p>
      </footer>
    </main>
  )
}

export default Login;