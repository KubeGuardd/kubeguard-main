// src/hooks/useAuth.js
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { msalInstance, msalInitPromise, loginRequest } from '../auth/msalConfig'
import { verifyToken } from '../services/api'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { setAuth, clearAuth, setLoading } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // AuthCallback.jsx owns the redirect handling — do nothing on that route
    // Also do nothing if already authenticated — prevents re-running on every navigation
    if (location.pathname === '/auth/callback') return

    const tryRestoreSession = async () => {
      try {
        await msalInitPromise

        // NEVER call handleRedirectPromise() here — AuthCallback owns that.
        // Only try silent token restoration from an existing session.
        const accounts = msalInstance.getAllAccounts()
        if (accounts.length === 0) {
          clearAuth()
          return
        }

        msalInstance.setActiveAccount(accounts[0])
        const silentResult = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        const response = await verifyToken(silentResult.accessToken)
        setAuth(response.data, silentResult.accessToken)
      } catch (err) {
        console.warn('[useAuth] Session restore failed:', err.message)
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    tryRestoreSession()
    // Run ONLY once on mount — not on every route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
