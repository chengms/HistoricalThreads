import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import TimelinePage from './pages/Timeline'
import NetworkPage from './pages/Network/index'
import DetailPage from './pages/Detail'
import SuggestionPage from './pages/Suggestion'
import SuggestionsListPage from './pages/SuggestionsList'
import HomePage from './pages/Home'

function App() {
  // 检测是否使用自定义域名
  // 如果设置了 VITE_USE_CUSTOM_DOMAIN=true，或者当前域名不是 github.io，则使用根路径
  const isCustomDomain = import.meta.env.VITE_USE_CUSTOM_DOMAIN === 'true' || 
                         (typeof window !== 'undefined' && 
                          !window.location.hostname.includes('github.io') && 
                          window.location.hostname !== 'localhost' &&
                          window.location.hostname !== '127.0.0.1')
  
  const basename = isCustomDomain ? '' : (import.meta.env.PROD ? '/HistoricalThreads' : '')
  
  // 调试信息（仅在开发环境或自定义域名时显示）
  if (typeof window !== 'undefined' && (import.meta.env.DEV || isCustomDomain)) {
    console.log('[App] 域名检测:', {
      hostname: window.location.hostname,
      isCustomDomain,
      basename,
      envVar: import.meta.env.VITE_USE_CUSTOM_DOMAIN,
      prod: import.meta.env.PROD
    })
  }
  
  return (
    <ErrorBoundary>
      <BrowserRouter
        basename={basename}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout>
          <Routes>
            <Route path="/" element={<TimelinePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            {/* allow extra sub-paths (e.g. /network/xxx) to still render the graph */}
            <Route path="/network/*" element={<NetworkPage />} />

            {/* Friendly Chinese aliases */}
            <Route path="/中国历史时间线" element={<TimelinePage />} />
            <Route path="/中国历史时间线/*" element={<TimelinePage />} />
            <Route path="/关系图谱" element={<NetworkPage />} />
            <Route path="/关系图谱/*" element={<NetworkPage />} />

            <Route path="/detail/:type/:id" element={<DetailPage />} />
            <Route path="/suggestion" element={<SuggestionPage />} />
            <Route path="/suggestions" element={<SuggestionsListPage />} />

            {/* Fallback: redirect unknown paths to timeline */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

