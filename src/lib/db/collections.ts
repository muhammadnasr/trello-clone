import type { RxCollection } from 'rxdb'
import type { Board } from '../types/board'
import type { Column } from '../types/column'
import type { Card } from '../types/card'

export type BoardCollection = {
  boards: RxCollection<Board>
}

export type ColumnCollection = {
  columns: RxCollection<Column>
}

export type CardCollection = {
  cards: RxCollection<Card>
}

export type TrelloCollections = BoardCollection & ColumnCollection & CardCollection

