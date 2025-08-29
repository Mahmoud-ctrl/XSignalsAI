import { useEffect, useState } from "react"
import axios from "axios"
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion"
import { Activity, ArrowRight, Loader2, Mail, Shield, KeyRound, Check } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Alert, AlertDescription } from "../components/ui/alert"
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_REACT_APP_API;

// Helper function to construct API paths
const apiPath = (path) => `${API_URL}${path}`;

function OrbitsBackground() {
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

const ForgotPassword = () => {
  const [step, setStep] = useState('email') // 'email' or 'reset'
  const [formData, setFormData] = useState({ email: "", code: "", password: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRequestReset(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    
    try {
      const res = await axios.post(apiPath("/request-password-reset"), {
        email: formData.email,
      }, 
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          'X-CSRF-TOKEN': Cookies.get('csrf_access_token')
        }
      }
    )
      
      setMessage(res?.data?.message || "Reset code sent to your email!")
      setStep('reset')
      
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to send reset code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    
    try {
      const res = await axios.post(apiPath("/reset-password"), {
        email: formData.email,
        code: formData.code,
        password: formData.password
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          'X-CSRF-TOKEN': Cookies.get('csrf_access_token')
        }
      }
    )
      
      setMessage(res?.data?.message || "Password reset successfully!")
      
      // Redirect to login after successful reset
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
      
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to reset password. Please check your code and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Autofocus the first input field
    const el = step === 'email' 
      ? document.getElementById("email")
      : document.getElementById("code")
    el?.focus()
  }, [step])

  return (
    <main className="relative min-h-[100dvh] bg-[#0b0d12] text-white">
      <OrbitsBackground />
      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        {/* Left: Reset password content */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <Shield className="h-3.5 w-3.5 text-orange-400" />
            <span>{step === 'email' ? "Password Recovery" : "Reset Code Sent"}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
            {step === 'email' ? "Forgot your password?" : "Enter reset code"}
          </h1>
          <p className="max-w-lg text-zinc-300">
            {step === 'email' 
              ? "No worries! Enter your email address and we'll send you a reset code to get you back into your account."
              : "We've sent a 6-digit code to your email. Enter it below along with your new password."
            }
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-zinc-300">
              <Mail className="h-5 w-5 text-orange-400" />
              <span>{"Email verification"}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <KeyRound className="h-5 w-5 text-orange-400" />
              <span>{"Secure reset"}</span>
            </div>
          </div>

          {/* Subtle moving underline accent */}
          <motion.div
            className="h-px w-40 bg-orange-500/70"
            animate={{ width: ["8rem", "11rem", "8rem"] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        {/* Right: Reset password card */}
        <Card className="relative border-zinc-800 bg-zinc-950/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 'email' ? "Reset Password" : "New Password"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === 'email' 
                ? "Enter your email to receive a reset code"
                : "Enter the code from your email and your new password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className={`border-zinc-800 bg-zinc-900/60 ${
                message.includes('sent') || message.includes('successfully') || message.includes('Reset code') 
                  ? 'text-green-300' 
                  : 'text-red-300'
              }`}>
                <AlertDescription className="flex items-center gap-2">
                  {(message.includes('sent') || message.includes('successfully')) && 
                    <Check className="h-4 w-4" />
                  }
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email Address
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {"Sending code..."}
                    </>
                  ) : (
                    <>
                      {"Send Reset Code"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-zinc-300">
                    Reset Code
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    className="text-white placeholder:text-zinc-500 text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="text-white placeholder:text-zinc-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {"Resetting password..."}
                    </>
                  ) : (
                    <>
                      {"Reset Password"}
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('email')}
                  className="w-full text-zinc-400 hover:text-white"
                >
                  {"← Back to email"}
                </Button>
              </form>
            )}

            <div className="pt-4">
              <p className="text-center text-sm text-zinc-400">
                Remember your password?{" "}
                <Link to="/login" className="text-orange-400 hover:text-orange-300">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-zinc-500">
        <p>{"Reset codes expire in 15 minutes for your security."}</p>
      </footer>
    </main>
  )
}

export default ForgotPassword;