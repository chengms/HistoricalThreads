import { Request, Response } from 'express'

export const getRelationships = async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, personId, relationshipType } = req.query

    // TODO: 从数据库查询
    res.json({
      success: true,
      data: [],
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: 0,
        totalPages: 0,
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

export const getNetwork = async (req: Request, res: Response) => {
  try {
    const { personId, dynastyId, depth } = req.query

    // TODO: 从数据库查询关系网络
    res.json({
      success: true,
      data: {
        nodes: [],
        edges: [],
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

