export const columnSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    boardId: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
    },
    order: {
      type: 'number',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: ['id', 'boardId', 'title', 'order', 'createdAt', 'updatedAt'],
  indexes: ['boardId'],
}

