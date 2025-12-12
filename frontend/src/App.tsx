import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import TimelinePage from './pages/Timeline'
import NetworkPage from './pages/Network'
import DetailPage from './pages/Detail'
import SuggestionPage from './pages/Suggestion'
import HomePage from './pages/Home'

function App() {
  // 检测是否使用自定义域名
  // 如果设置了 VITE_USE_CUSTOM_DOMAIN=true，或者当前域名不是 github.io，则使用根路径
  const isCustomDomain = import.meta.env.VITE_USE_CUSTOM_DOMAIN === 'true' || 
                         (typeof window !== 'undefined' && !window.location.hostname.includes('github.io'))
  
  const basename = isCustomDomain ? '' : (import.meta.env.PROD ? '/HistoricalThreads' : '')
  
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<TimelinePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/detail/:type/:id" element={<DetailPage />} />
            <Route path="/suggestion" element={<SuggestionPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

