export interface Card {
  id: string
  columnId: string
  title: string
  order: number
  ownerId: string
  accessibleUserIds: string[]
  createdAt: string
  updatedAt: string
}

