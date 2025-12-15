import type { RxCollection } from 'rxdb'
import type { Board } from '../types/board'
import type { Column } from '../types/column'

export type BoardCollection = {
  boards: RxCollection<Board>
}

export type ColumnCollection = {
  columns: RxCollection<Column>
}

export type TrelloCollections = BoardCollection & ColumnCollection

