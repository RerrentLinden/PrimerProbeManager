// --- Primer ---
export interface Primer {
  readonly id: number
  readonly name: string
  readonly sequence: string
  readonly base_count: number
  readonly type: 'primer' | 'probe'
  readonly modification_5prime: string | null
  readonly modification_3prime: string | null
  readonly mw: number | null
  readonly ug_per_od: number | null
  readonly nmol_per_od: number | null
  readonly gc_percent: number | null
  readonly tm: number | null
  readonly purification_method: string | null
  readonly active_tube_count?: number
  readonly total_remaining_volume_ul?: number
  readonly low_volume_alert_threshold_ul?: number | null
  readonly projects?: { id: number; name: string }[]
  readonly created_at: string
  readonly updated_at: string
}

export interface PrimerCreate {
  readonly name: string
  readonly sequence: string
  readonly modification_5prime: string | null
  readonly modification_3prime: string | null
  readonly mw: number | null
  readonly ug_per_od?: number | null
  readonly nmol_per_od?: number | null
  readonly gc_percent?: number | null
  readonly tm: number | null
  readonly purification_method?: string | null
  readonly low_volume_alert_threshold_ul?: number | null
}

export interface ProjectPrimer {
  readonly id: number
  readonly name: string
  readonly sequence: string
  readonly base_count: number
  readonly type: 'primer' | 'probe'
  readonly modification_5prime: string | null
  readonly modification_3prime: string | null
  readonly mw: number | null
  readonly ug_per_od: number | null
  readonly nmol_per_od: number | null
  readonly gc_percent: number | null
  readonly tm: number | null
  readonly purification_method: string | null
  readonly active_tube_count: number
  readonly total_remaining_volume_ul: number
  readonly low_volume_alert_threshold_ul: number | null
}

// --- Tube ---
export interface PrimerTube {
  readonly id: number
  readonly primer_id: number
  readonly batch_number: string
  readonly tube_number: string | null
  readonly dissolution_date: string | null
  readonly initial_volume_ul: number
  readonly remaining_volume_ul: number
  readonly status: 'active' | 'archived'
  readonly project: string | null
  readonly created_at: string
  readonly updated_at: string
  readonly primer_name?: string
  readonly primer_type?: 'primer' | 'probe'
  readonly position?: BoxPositionInfo | null
}

export interface TubeCreate {
  readonly batch_number: string
  readonly tube_number?: string | null
  readonly dissolution_date?: string | null
  readonly initial_volume_ul: number
  readonly project?: string | null
}

export interface BoxPositionInfo {
  readonly box_id: number
  readonly box_name: string
  readonly storage_location: string | null
  readonly storage_temperature: string | null
  readonly row: number
  readonly col: number
}

// --- Usage Log ---
export interface UsageLog {
  readonly id: number
  readonly tube_id: number
  readonly usage_date: string
  readonly volume_used_ul: number
  readonly purpose: string | null
  readonly project: string | null
  readonly remaining_after_ul: number
  readonly created_at: string
}

export interface UsageLogCreate {
  readonly volume_used_ul: number
  readonly purpose?: string | null
  readonly project?: string | null
}

export interface TubeLifecycleLog {
  readonly id: number
  readonly tube_id: number
  readonly primer_id: number
  readonly primer_name: string
  readonly primer_type: 'primer' | 'probe'
  readonly batch_number: string
  readonly tube_number: string | null
  readonly action: 'created' | 'placed' | 'moved' | 'used' | 'archived'
  readonly title: string
  readonly description: string
  readonly from_position: string | null
  readonly to_position: string | null
  readonly volume_used_ul: number | null
  readonly remaining_volume_ul: number | null
  readonly purpose: string | null
  readonly project_name: string | null
  readonly archive_reason: string | null
  readonly created_at: string
}

export interface TubeLifecycleLogFilter {
  readonly preset?: '24h' | '7d' | '30d'
  readonly start_date?: string
  readonly end_date?: string
}

// --- Freezer Box ---
export interface FreezerBox {
  readonly id: number
  readonly name: string
  readonly rows: number
  readonly cols: number
  readonly storage_location: string | null
  readonly storage_temperature: string | null
  readonly created_at: string
  readonly updated_at: string
  readonly occupied_count?: number
}

export interface FreezerBoxCreate {
  readonly name: string
  readonly rows?: number
  readonly cols?: number
  readonly storage_location?: string | null
  readonly storage_temperature?: string | null
}

export interface GridSlot {
  readonly row: number
  readonly col: number
  readonly tube: GridTubeInfo | null
}

export interface GridTubeInfo {
  readonly tube_id: number
  readonly primer_id: number
  readonly primer_name: string
  readonly primer_type: 'primer' | 'probe'
  readonly batch_number: string
  readonly tube_number: string | null
  readonly remaining_volume_ul: number
  readonly initial_volume_ul: number
}

// --- Project ---
export interface Project {
  readonly id: number
  readonly name: string
  readonly description: string | null
  readonly created_at: string
  readonly updated_at: string
  readonly primer_count?: number
  readonly gene_count?: number
  readonly primers?: ProjectPrimer[]
  readonly genes?: ProjectGene[]
}

export interface ProjectCreate {
  readonly name: string
  readonly description?: string | null
}

export interface ProjectGene {
  readonly id: number
  readonly project_id: number
  readonly gene_name: string
  readonly tube_number: number | null
  readonly fluorescence_channel: string | null
  readonly sort_order: number
}

export interface ProjectGeneCreate {
  readonly gene_name: string
  readonly tube_number?: number | null
  readonly fluorescence_channel?: string | null
}

// --- Import ---
export interface ImportPreview {
  readonly new_primers: number
  readonly update_primers: number
  readonly new_tubes: number
  readonly update_tubes: number
  readonly conflicts: ImportConflict[]
  readonly rows: ImportRow[]
}

export interface ImportConflict {
  readonly row: number
  readonly field: string
  readonly message: string
}

export interface ImportRow {
  readonly row_number: number
  readonly status: 'new' | 'update' | 'conflict'
  readonly data: Record<string, string>
  readonly error?: string
}

// --- Stats ---
export interface Stats {
  readonly primer_count: number
  readonly probe_count: number
  readonly active_tube_count: number
  readonly low_volume_count: number
}

export interface LowVolumeAlert {
  readonly tube_id: number
  readonly primer_name: string
  readonly batch_number: string
  readonly remaining_volume_ul: number
  readonly initial_volume_ul: number
  readonly position?: BoxPositionInfo | null
}

// --- Pagination ---
export interface PaginatedResponse<T> {
  readonly items: T[]
  readonly total: number
  readonly page: number
  readonly page_size: number
}

// --- Auth ---
export interface AuthResponse {
  readonly valid: boolean
  readonly message: string
}
