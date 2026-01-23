import { ReactFlowProvider } from '@xyflow/react'
import Header from './components/Header/Header'
import TemplateSelector from './components/Sidebar/TemplateSelector'
import ServiceSelector from './components/Sidebar/ServiceSelector'
import ConfigPanel from './components/Sidebar/ConfigPanel'
import ArchitectureDiagram from './components/Diagram/ArchitectureDiagram'
import CodePreview from './components/CodePreview/CodePreview'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
              <div className="p-4 space-y-6">
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
              <div className="h-80 border-t border-gray-700">
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
