import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import eventRoutes from './routes/events'
import personRoutes from './routes/persons'
import relationshipRoutes from './routes/relationships'
import dynastyRoutes from './routes/dynasties'
import suggestionRoutes from './routes/suggestions'
import searchRoutes from './routes/search'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/events', eventRoutes)
app.use('/api/persons', personRoutes)
app.use('/api/relationships', relationshipRoutes)
app.use('/api/dynasties', dynastyRoutes)
app.use('/api/suggestions', suggestionRoutes)
app.use('/api/search', searchRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

