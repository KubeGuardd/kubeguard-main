import { LogLevel, PublicClientApplication } from '@azure/msal-browser'

const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || 'c4a7882d-0496-4404-b13a-e0f5ed77822e'
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || 'd8537334-bc24-4daf-95a8-bf4c9fb14394'

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        if (import.meta.env.DEV) console.log(`[MSAL] ${message}`)
      },
      logLevel: LogLevel.Warning,
    },
  },
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', `api://${CLIENT_ID}/access_as_user`],
}

export const msalInstance = new PublicClientApplication(msalConfig)
export const msalInitPromise = msalInstance.initialize()
