import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import TimelinePage from './pages/Timeline'
import NetworkPage from './pages/Network/index'
import DetailPage from './pages/Detail'
import SuggestionPage from './pages/Suggestion'
import SuggestionsListPage from './pages/SuggestionsList'
import HomePage from './pages/Home'
import KnowledgePointsPage from './pages/KnowledgePoints'

function App() {
  // basename 统一从 Vite 的 BASE_URL 推断（当前配置为根路径 '/'，因此 basename 为空字符串）
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  
  // 调试信息（仅在开发环境显示）
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log('[App] 域名检测:', {
      hostname: window.location.hostname,
      basename,
      baseUrl: import.meta.env.BASE_URL,
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
            <Route path="/knowledge-points" element={<KnowledgePointsPage />} />
            <Route path="/知识点" element={<KnowledgePointsPage />} />

            {/* Fallback: redirect unknown paths to timeline */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

