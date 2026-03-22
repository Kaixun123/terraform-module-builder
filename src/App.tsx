import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Header from './components/Header/Header'
import { ProviderSelector } from './components/Sidebar/ProviderSelector'
import TemplateSelector from './components/Sidebar/TemplateSelector'
import ServiceSelector from './components/Sidebar/ServiceSelector'
import ConfigPanel from './components/Sidebar/ConfigPanel'
import ArchitectureDiagram from './components/Diagram/ArchitectureDiagram'
import CodePreview from './components/CodePreview/CodePreview'
import ErrorBoundary from './components/ErrorBoundary'
import PRModal from './components/PRModal/PRModal'
import { useGitHubStore } from './stores/githubStore'
import { getAuthenticatedUser } from './lib/github'

function App() {
  const [showPRModal, setShowPRModal] = useState(false)
  const { setToken, setUser, setAuthenticating } = useGitHubStore()

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'github_oauth') return

      setAuthenticating(false)
      const { token, error } = event.data as { token?: string; error?: string }

      if (error || !token) {
        console.error('GitHub auth error:', error)
        return
      }

      setToken(token)
      try {
        const user = await getAuthenticatedUser(token)
        setUser(user)
      } catch {
        // token is stored; user info is non-critical
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [setToken, setUser, setAuthenticating])

  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <div className="h-screen flex flex-col bg-gray-900 text-gray-100 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800/30">
          <Header onCreatePR={() => setShowPRModal(true)} />
          {showPRModal && <PRModal onClose={() => setShowPRModal(false)} />}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-gray-800/90 overflow-y-auto flex-shrink-0 shadow-xl shadow-black/20">
              <div className="p-5 space-y-6">
                <ProviderSelector />
                <TemplateSelector />
                <ServiceSelector />
                <ConfigPanel />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Architecture Diagram */}
              <div className="flex-1 min-h-0">
                <ErrorBoundary
                  fallback={
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <p className="text-gray-500">Failed to load diagram</p>
                    </div>
                  }
                >
                  <ArchitectureDiagram />
                </ErrorBoundary>
              </div>

              {/* Code Preview */}
              <div className="h-80 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
                <ErrorBoundary
                  fallback={
                    <div className="h-full bg-gray-800 flex items-center justify-center">
                      <p className="text-gray-500">Failed to load code preview</p>
                    </div>
                  }
                >
                  <CodePreview />
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </ReactFlowProvider>
    </ErrorBoundary>
  )
}

export default App
