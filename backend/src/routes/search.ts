import express from 'express'
import { search } from '../controllers/searchController'

const router = express.Router()

// GET /api/search - 全文搜索
router.get('/', search)

export default router

