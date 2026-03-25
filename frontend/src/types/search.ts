import type { BoxPositionInfo } from './index'

export interface SearchPrimerProjectInfo {
  readonly id: number
  readonly name: string
}

export interface SearchPrimerResult {
  readonly id: number
  readonly name: string
  readonly sequence: string
  readonly modification_5prime: string | null
  readonly modification_3prime: string | null
  readonly type: 'primer' | 'probe'
  readonly mw: number | null
  readonly projects: SearchPrimerProjectInfo[]
}

export interface SearchTubeResult {
  readonly id: number
  readonly primer_id: number
  readonly primer_name: string
  readonly batch_number: string
  readonly tube_number: string | null
  readonly position: BoxPositionInfo | null
}

export interface SearchBoxResult {
  readonly id: number
  readonly name: string
  readonly storage_location: string | null
}

export interface SearchProjectResult {
  readonly id: number
  readonly name: string
}

export interface SearchResults {
  readonly primers: SearchPrimerResult[]
  readonly tubes: SearchTubeResult[]
  readonly boxes: SearchBoxResult[]
  readonly projects: SearchProjectResult[]
}
