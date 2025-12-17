export const cardSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    columnId: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
    },
    order: {
      type: 'number',
    },
    ownerId: {
      type: 'string',
      maxLength: 100,
    },
    accessibleUserIds: {
      type: 'array',
      items: {
        type: 'string',
      },
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
  required: ['id', 'columnId', 'title', 'order', 'ownerId', 'accessibleUserIds', 'createdAt', 'updatedAt'],
  indexes: ['columnId', 'ownerId'],
}

