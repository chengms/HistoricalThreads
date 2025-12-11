import express from 'express'
import { getPersons, getPersonById, getPersonEvents, getPersonRelationships } from '../controllers/personController'

const router = express.Router()

// GET /api/persons - 获取人物列表
router.get('/', getPersons)

// GET /api/persons/:id - 获取人物详情
router.get('/:id', getPersonById)

// GET /api/persons/:id/events - 获取人物相关事件
router.get('/:id/events', getPersonEvents)

// GET /api/persons/:id/relationships - 获取人物关系
router.get('/:id/relationships', getPersonRelationships)

export default router

