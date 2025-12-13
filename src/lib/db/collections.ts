import type { RxCollection } from 'rxdb'
import type { BoardDocument } from '../types/board'

// Board collection schema
export const boardSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100, // primary key must have maxLength
    },
    title: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
    ownerId: {
      type: 'string',
    },
  },
  required: ['id', 'title', 'createdAt', 'updatedAt', 'ownerId'],
}

// Board collection type
export type BoardCollection = {
  boards: RxCollection<BoardDocument>
}

