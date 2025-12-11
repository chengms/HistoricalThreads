import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import TimelinePage from './pages/Timeline'
import NetworkPage from './pages/Network'
import DetailPage from './pages/Detail'
import SuggestionPage from './pages/Suggestion'
import HomePage from './pages/Home'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
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

