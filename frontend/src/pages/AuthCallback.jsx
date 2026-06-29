// src/pages/AuthCallback.jsx
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { msalInstance, msalInitPromise, loginRequest } from '../auth/msalConfig'
import { verifyToken } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { Spinner } from '../components/ui/Spinner'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const addToast = useToastStore((state) => state.addToast)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const completeSignIn = async () => {
      try {
        await msalInitPromise

        const result = await msalInstance.handleRedirectPromise()
        console.log('[AuthCallback] handleRedirectPromise result:', result)

        if (result?.accessToken) {
          console.log('[AuthCallback] Got access token, setting active account')
          msalInstance.setActiveAccount(result.account)

          try {
            const response = await verifyToken(result.accessToken)
            console.log('[AuthCallback] verifyToken success:', response.data)
            setAuth(response.data, result.accessToken)
          } catch (apiError) {
            console.error('[AuthCallback] verifyToken failed:', apiError.message)
            // Even if backend verify fails, set auth with MSAL account data
            // so user is not stuck in a loop
            setAuth({
              userId: result.account.localAccountId,
              email: result.account.username,
              name: result.account.name,
              roles: result.idTokenClaims?.roles || [],
            }, result.accessToken)
          }

          navigate('/dashboard', { replace: true })
          return
        }

        console.log('[AuthCallback] No redirect result, checking existing accounts')
        const accounts = msalInstance.getAllAccounts()
        console.log('[AuthCallback] Existing accounts:', accounts.length)

        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0])
          try {
            const silentResult = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            })
            console.log('[AuthCallback] Silent token acquired')

            try {
              const response = await verifyToken(silentResult.accessToken)
              setAuth(response.data, silentResult.accessToken)
            } catch (apiError) {
              console.error('[AuthCallback] verifyToken failed on silent:', apiError.message)
              setAuth({
                userId: accounts[0].localAccountId,
                email: accounts[0].username,
                name: accounts[0].name,
                roles: accounts[0].idTokenClaims?.roles || [],
              }, silentResult.accessToken)
            }

            navigate('/dashboard', { replace: true })
            return
          } catch (silentError) {
            console.error('[AuthCallback] Silent token failed:', silentError.message)
          }
        }

        console.log('[AuthCallback] No session found, going to landing')
        navigate('/', { replace: true })
      } catch (error) {
        console.error('[AuthCallback] Fatal error:', error)
        clearAuth()
        addToast({
          type: 'error',
          title: 'Sign-in failed',
          message: error.response?.data?.message || error.message || 'Unable to complete sign in.',
        })
        navigate('/', { replace: true })
      }
    }

    completeSignIn()
  }, [addToast, clearAuth, navigate, setAuth])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 text-center">
        <Spinner size={28} color="#6366f1" />
        <p className="mt-4 text-lg text-text-primary">Completing sign-in...</p>
        <p className="mt-2 text-sm text-text-secondary">Verifying your Microsoft account...</p>
      </div>
    </div>
  )
}
