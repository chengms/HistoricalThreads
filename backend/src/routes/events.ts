import express from 'express'
import { getEvents, getEventById, getTimeline } from '../controllers/eventController'

const router = express.Router()

// GET /api/events - 获取事件列表
router.get('/', getEvents)

// GET /api/events/timeline - 获取时间线数据
router.get('/timeline', getTimeline)

// GET /api/events/:id - 获取事件详情
router.get('/:id', getEventById)

export default router

