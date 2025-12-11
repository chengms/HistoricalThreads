import { Request, Response } from 'express'

// 临时模拟数据，后续替换为数据库查询
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, dynastyId, eventType, startYear, endYear, search } = req.query

    // TODO: 从数据库查询
    const mockEvents = [
      {
        id: 1,
        title: '秦始皇统一六国',
        description: '秦始皇统一六国，建立了中国历史上第一个统一的中央集权国家。',
        eventYear: -221,
        eventType: 'political',
        dynastyId: 1,
      },
    ]

    res.json({
      success: true,
      data: mockEvents,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: mockEvents.length,
        totalPages: Math.ceil(mockEvents.length / Number(pageSize)),
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    })
  }
}

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // TODO: 从数据库查询
    const mockEvent = {
      id: Number(id),
      title: '秦始皇统一六国',
      description: '秦始皇统一六国，建立了中国历史上第一个统一的中央集权国家。',
      eventYear: -221,
      eventType: 'political',
      dynastyId: 1,
    }

    res.json({
      success: true,
      data: mockEvent,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    })
  }
}

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const { startYear, endYear, dynastyId, eventType } = req.query

    // TODO: 从数据库查询
    const mockEvents = [
      {
        id: 1,
        title: '秦始皇统一六国',
        description: '秦始皇统一六国',
        eventYear: -221,
        eventType: 'political',
        dynastyId: 1,
      },
      {
        id: 2,
        title: '汉武帝开疆拓土',
        description: '汉武帝开疆拓土',
        eventYear: -140,
        eventType: 'military',
        dynastyId: 2,
      },
    ]

    res.json({
      success: true,
      data: mockEvents,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    })
  }
}

