import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from "framer-motion"
import { Activity, ArrowRight, CheckCircle2, Loader2, Mail, Shield, User, Eye, EyeOff, Gift, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
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

function Brand({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
        <Activity className="h-5 w-5" />
      </span>
      <span className="font-semibold text-white">CryptoSignals</span>
    </div>
  )
}

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

const Signup = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", promo: "" })
  const [step, setStep] = useState("signup")
  const [emailForVerification, setEmailForVerification] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [promoExpanded, setPromoExpanded] = useState(false)
  const [promoFromUrl, setPromoFromUrl] = useState("")
  
  // Referral validation states
  const [referralValidation, setReferralValidation] = useState({
    isValidating: false,
    isValid: null,
    message: ""
  })

  const location = useLocation()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Extract promo code from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const promoCode = urlParams.get('ref')
    if (promoCode) {
      setPromoFromUrl(promoCode)
      setFormData(prev => ({ ...prev, promo: promoCode }))
      setPromoExpanded(true) // Auto-expand promo section if code is in URL
      // Validate the referral code from URL automatically
      validateReferralCode(promoCode)
    }
  }, [location.search])

  // Validate referral code function
  const validateReferralCode = async (code) => {
    if (!code || !code.trim()) {
      setReferralValidation({
        isValidating: false,
        isValid: null,
        message: ""
      })
      return
    }

    setReferralValidation(prev => ({ ...prev, isValidating: true }))
    
    try {
      const response = await axios.post(apiPath("/validate-referral"), {
        code: code.trim()
      })
      
      setReferralValidation({
        isValidating: false,
        isValid: true,
        message: response.data.message || "Referral code is valid! You'll get bonus trial time."
      })
    } catch (error) {
      setReferralValidation({
        isValidating: false,
        isValid: false,
        message: error?.response?.data?.error || "Invalid referral code"
      })
    }
  }

  // Debounced referral validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateReferralCode(formData.promo)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.promo])

  const titleByStep = useMemo(
    () => ({
      signup: "Create your account",
      verify: "Confirm your email",
      done: "You're all set",
    }),
    [],
  )

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSignup(e) {
    e.preventDefault()
    
    // Check if promo code is provided but not valid
    if (formData.promo && formData.promo.trim() && referralValidation.isValid !== true) {
      setMessage("Please enter a valid referral code or remove it to continue.")
      return
    }
    
    setLoading(true)
    setMessage("")
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      }
      
      // Only include promo if it has a value and is valid
      if (formData.promo && formData.promo.trim() && referralValidation.isValid === true) {
        payload.promo = formData.promo.trim()
      }

      const res = await axios.post(apiPath("/signup"), payload)
      setEmailForVerification(formData.email)
      setStep("verify")
      
      let successMessage = res?.data?.message || "Signup successful. Please check your inbox for the code."
      if (formData.promo && formData.promo.trim() && referralValidation.isValid === true) {
        successMessage += " Your referral code has been applied!"
      }
      
      setMessage(successMessage)
    } catch (err) {
      setMessage(err?.response?.data?.error || "Signup failed.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await axios.post(apiPath("/verify"), {
        email: emailForVerification,
        code: verificationCode,
      })
      setMessage(res?.data?.message || "Email verified! You can now log in.")
      setStep("done")
    } catch (err) {
      setMessage(err?.response?.data?.error || "Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    // Check if promo code is provided but not valid
    if (formData.promo && formData.promo.trim() && referralValidation.isValid !== true) {
      setMessage("Please enter a valid referral code or remove it to continue.")
      return
    }
    
    setLoading(true)
    setMessage("")
    try {
      const payload = {
        credential: credentialResponse?.credential,
      }
      
      // Include promo code if available and valid
      if (formData.promo && formData.promo.trim() && referralValidation.isValid === true) {
        payload.promo = formData.promo.trim()
      }

      const res = await axios.post(apiPath("/google-auth"), payload)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("access_token", res?.data?.access_token)
      }
      
      let successMessage = `Welcome ${res?.data?.user?.email || "back"}!`
      if (formData.promo && formData.promo.trim() && referralValidation.isValid === true && res?.data?.is_new_user) {
        successMessage += " Your referral code has been applied!"
      }
      
      setMessage(successMessage)
      setStep("done")
    } catch (err) {
      setMessage(err?.response?.data?.error || "Google signup failed.")
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleError() {
    setMessage("Google signup failed.")
  }

  useEffect(() => {
    // Autofocus helpful inputs by step
    const id = step === "signup" ? "username" : step === "verify" ? "code" : undefined
    if (!id) return
    const el = document.getElementById(id)
    el?.focus()
  }, [step])

  return (
    <main className="relative min-h-[100dvh] bg-[#0b0d12] text-white">
      <OrbitsBackground />

      {/* <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <div className="flex items-center gap-3">
          <Link to="/pricing" className="text-sm text-zinc-300 hover:text-white">
            Pricing
          </Link>
          <Link to="/docs" className="text-sm text-zinc-300 hover:text-white">
            Docs
          </Link>
          <Link to="/login">
            <Button variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900">
              Sign In
            </Button>
          </Link>
        </div>
      </header> */}

      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        {/* Left: Value props and subtle motion accent */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <Shield className="h-3.5 w-3.5 text-orange-400" />
            <span>{"Secure by design"}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">{titleByStep[step]}</h1>
          <p className="max-w-lg text-zinc-300">
            Set up your XSignals AI account to access real-time AI insights, alerts, and analytics tailored for active
            traders. No fluff—just the tools you need.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="h-5 w-5 text-orange-400" />
              <span>{"7 day free trial"}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="h-5 w-5 text-orange-400" />
              <span>{"No credit card required"}</span>
            </div>
          </div>

          {/* Show promo code bonus if applied and valid */}
          {formData.promo && referralValidation.isValid === true && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-green-400">
              <Gift className="h-4 w-4" />
              <span className="text-sm">Referral bonus activated!</span>
            </div>
          )}

          {/* Subtle moving underline accent */}
          <motion.div
            className="h-px w-40 bg-orange-500/70"
            animate={{ width: ["8rem", "11rem", "8rem"] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        {/* Right: Auth card */}
        <Card className="relative border-zinc-800 bg-zinc-950/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">
              {step === "signup" && "Sign up with email"}
              {step === "verify" && "Enter your code"}
              {step === "done" && "Account ready"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === "signup" && "Use your work email for better account recovery."}
              {step === "verify" && `We sent a confirmation code to ${emailForVerification || "your email"}.`}
              {step === "done" && "You can now sign in and start exploring signals."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className="border-zinc-800 bg-zinc-900/60 text-zinc-200">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {step === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-zinc-300">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="username"
                      name="username"
                      placeholder="satoshi"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="pl-9 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>

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
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
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

                {/* Promo Code Section */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPromoExpanded(!promoExpanded)}
                    className="flex w-full items-center justify-between text-left text-sm text-zinc-400 hover:text-zinc-300"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      <span>Have a referral code?</span>
                    </div>
                    {promoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {promoExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative">
                        <Gift className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          id="promo"
                          name="promo"
                          placeholder="Enter referral code"
                          value={formData.promo}
                          onChange={handleChange}
                          className={`pl-9 text-white placeholder:text-zinc-500 ${
                            formData.promo && referralValidation.isValid === false 
                              ? 'border-red-500 focus:border-red-500' 
                              : formData.promo && referralValidation.isValid === true 
                              ? 'border-green-500 focus:border-green-500' 
                              : ''
                          }`}
                        />
                        {referralValidation.isValidating && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                          </div>
                        )}
                        {!referralValidation.isValidating && formData.promo && referralValidation.isValid === true && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                        {!referralValidation.isValidating && formData.promo && referralValidation.isValid === false && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      
                      {/* Validation message */}
                      {formData.promo && referralValidation.message && (
                        <p className={`mt-1 text-xs ${
                          referralValidation.isValid === true ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {referralValidation.message}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || referralValidation.isValidating || (formData.promo && referralValidation.isValid === false)}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {"Creating account..."}
                    </>
                  ) : (
                    <>
                      {"Create account"}
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

                {/* Google Sign Up */}
                {googleClientId ? (
                  <GoogleOAuthProvider clientId={googleClientId}>
                    <div className="flex w-full justify-center">
                      <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={handleGoogleError} 
                        useOneTap 
                        disabled={referralValidation.isValidating || (formData.promo && referralValidation.isValid === false)}
                      />
                    </div>
                  </GoogleOAuthProvider>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full border-zinc-800 bg-transparent text-zinc-300"
                    title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-up"
                  >
                    {"Continue with Google (configure VITE_GOOGLE_CLIENT_ID)"}
                  </Button>
                )}

                <p className="text-center text-sm text-zinc-400">
                  Already have an account?{" "}
                  <Link to="/login" className="text-orange-400 hover:text-orange-300">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-zinc-300">
                    Verification code
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter the 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    className="text-white placeholder:text-zinc-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {"Verifying..."}
                    </>
                  ) : (
                    <>
                      {"Verify email"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-zinc-500">
                  Having trouble? Check your spam folder or request a new code from the sign-up step.
                </p>
              </form>
            )}

            {step === "done" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p>{"Your account is ready."}</p>
                </div>
                <div className="flex gap-3">
                  <Link to="/login" className="w-full">
                    <Button className="w-full bg-orange-500 text-white hover:bg-orange-600">Go to sign in</Button>
                  </Link>
                  <Link to="/dashboard" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                    >
                      Explore app
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-zinc-500">
        <p>{"By continuing, you acknowledge you have read and understand our Terms of Service."}</p>
      </footer>
    </main>
  )
}

export default Signup;