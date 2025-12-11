import express from 'express'
import { getRelationships, getNetwork } from '../controllers/relationshipController'

const router = express.Router()

// GET /api/relationships - 获取关系列表
router.get('/', getRelationships)

// GET /api/relationships/network - 获取关系网络数据
router.get('/network', getNetwork)

export default router

