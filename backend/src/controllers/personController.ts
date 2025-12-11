import { Request, Response } from 'express'

export const getPersons = async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, dynastyId, personType, search } = req.query

    // TODO: 从数据库查询
    const mockPersons = [
      {
        id: 1,
        name: '秦始皇',
        birthYear: -259,
        deathYear: -210,
        personType: ['politician'],
        dynastyId: 1,
      },
    ]

    res.json({
      success: true,
      data: mockPersons,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: mockPersons.length,
        totalPages: Math.ceil(mockPersons.length / Number(pageSize)),
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

export const getPersonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // TODO: 从数据库查询
    const mockPerson = {
      id: Number(id),
      name: '秦始皇',
      birthYear: -259,
      deathYear: -210,
      personType: ['politician'],
      dynastyId: 1,
    }

    res.json({
      success: true,
      data: mockPerson,
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

export const getPersonEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // TODO: 从数据库查询
    res.json({
      success: true,
      data: [],
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

export const getPersonRelationships = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // TODO: 从数据库查询
    res.json({
      success: true,
      data: [],
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

