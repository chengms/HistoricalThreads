import { Request, Response } from 'express'

export const getDynasties = async (req: Request, res: Response) => {
  try {
    // TODO: 从数据库查询
    const mockDynasties = [
      { id: 1, name: '秦朝', startYear: -221, endYear: -207 },
      { id: 2, name: '汉朝', startYear: -202, endYear: 220 },
      { id: 3, name: '唐朝', startYear: 618, endYear: 907 },
      { id: 4, name: '宋朝', startYear: 960, endYear: 1279 },
    ]

    res.json({
      success: true,
      data: mockDynasties,
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

