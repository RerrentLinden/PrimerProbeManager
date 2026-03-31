export type ImportAction = 'create' | 'update' | 'conflict' | 'skip' | 'error'
export type ImportConflictStrategy = 'error' | 'rename' | 'overwrite' | 'skip'
export type PrimerConflictStrategy = Exclude<ImportConflictStrategy, 'error'>

export interface PrimerImportPreviewRow {
  readonly row_number: number
  readonly import_key: string
  readonly name: string
  readonly resolved_name: string | null
  readonly sequence: string
  readonly project_names: string[]
  readonly modification_5prime: string | null
  readonly modification_3prime: string | null
  readonly mw: number | null
  readonly tm: number | null
  readonly action: ImportAction
  readonly message: string | null
  readonly conflict_existing_name: string | null
  readonly conflict_existing_sequence: string | null
  readonly suggested_name: string | null
  readonly available_strategies: PrimerConflictStrategy[]
}

export interface TubeImportPreviewRow {
  readonly row_number: number
  readonly import_key: string
  readonly primer_name: string
  readonly primer_mw: number | null
  readonly batch_number: string
  readonly tube_number: string | null
  readonly dissolution_date: string | null
  readonly initial_volume_ul: number
  readonly box_name: string | null
  readonly well_position: string | null
  readonly placement_message: string | null
  readonly action: ImportAction
  readonly message: string | null
}

export interface ImportPreview {
  readonly primers: PrimerImportPreviewRow[]
  readonly tubes: TubeImportPreviewRow[]
  readonly primer_create_count: number
  readonly primer_update_count: number
  readonly primer_conflict_count: number
  readonly tube_create_count: number
  readonly tube_update_count: number
  readonly tube_conflict_count: number
  readonly tube_placement_count: number
  readonly error_count: number
  readonly available_conflict_strategies: ImportConflictStrategy[]
}

export interface PrimerConflictResolution {
  readonly import_key: string
  readonly strategy: PrimerConflictStrategy
  readonly renamed_name?: string | null
}

export interface ImportConfirmOptions {
  readonly default_conflict_strategy?: ImportConflictStrategy
  readonly primer_conflict_resolutions: PrimerConflictResolution[]
}

export interface ImportConfirmResult {
  readonly conflict_strategy: ImportConflictStrategy
  readonly primers_created: number
  readonly primers_updated: number
  readonly primers_renamed: number
  readonly primers_skipped: number
  readonly tubes_created: number
  readonly tubes_updated: number
  readonly tubes_skipped: number
  readonly tubes_placed: number
}

export interface DatabaseBackupResult {
  readonly file_name: string
  readonly file_path: string
  readonly size_bytes: number
  readonly created_at: string
}
