import client from './client'
import type { FreezerBox, FreezerBoxCreate, GridSlot } from '@/types'

export interface TubeSearchResult {
  box_id: number
  box_name: string
  row: number
  col: number
  primer_name: string
  batch_number: string
  tube_number: string | null
}

export function searchPlacedTubes(q: string) {
  return client.get<TubeSearchResult[]>('/boxes/search-tubes', { params: { q } })
}

export function fetchBoxes(search?: string) {
  return client.get<FreezerBox[]>('/boxes', {
    params: search ? { search } : undefined,
  })
}

export function fetchBox(id: number) {
  return client.get<FreezerBox & { grid: GridSlot[][] }>(`/boxes/${id}`)
}

export function createBox(data: FreezerBoxCreate) {
  return client.post<FreezerBox>('/boxes', data)
}

export function updateBox(id: number, data: Partial<FreezerBoxCreate>) {
  return client.put<FreezerBox>(`/boxes/${id}`, data)
}

export function deleteBox(id: number) {
  return client.delete(`/boxes/${id}`)
}

export function placePosition(boxId: number, row: number, col: number, tubeId: number) {
  return client.put(`/boxes/${boxId}/positions/${row}/${col}/place`, { tube_id: tubeId })
}

export function removePosition(boxId: number, row: number, col: number) {
  return client.put(`/boxes/${boxId}/positions/${row}/${col}/remove`)
}

interface MovePositionData {
  readonly from_row: number
  readonly from_col: number
  readonly to_row: number
  readonly to_col: number
  readonly to_box_id?: number
}

export function movePosition(boxId: number, data: MovePositionData) {
  return client.post(`/boxes/${boxId}/positions/move`, data)
}
