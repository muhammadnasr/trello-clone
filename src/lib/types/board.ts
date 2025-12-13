// Board document type matching the RxDB schema
export interface BoardDocument {
  id: string
  title: string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  ownerId: string
}

