import express from 'express'
import { createSuggestion, getSuggestions, getSuggestionById } from '../controllers/suggestionController'

const router = express.Router()

// GET /api/suggestions - 获取建议列表
router.get('/', getSuggestions)

// POST /api/suggestions - 创建建议
router.post('/', createSuggestion)

// GET /api/suggestions/:id - 获取建议详情
router.get('/:id', getSuggestionById)

export default router

