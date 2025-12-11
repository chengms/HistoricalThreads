import { Request, Response } from 'express'

export const search = async (req: Request, res: Response) => {
  try {
    const { q, type = 'all', page = 1, pageSize = 20 } = req.query

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '搜索关键词不能为空',
        },
      })
    }

    // TODO: 实现全文搜索
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

