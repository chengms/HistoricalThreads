import express from 'express'
import { getDynasties } from '../controllers/dynastyController'

const router = express.Router()

// GET /api/dynasties - 获取朝代列表
router.get('/', getDynasties)

export default router

