export const boardSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
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
    editors: {
      type: 'array',
      items: { type: 'string' },
      default: [],
    },
  },
  required: ['id', 'title', 'createdAt', 'updatedAt', 'ownerId'],
}

