import client from './client'
import type { Project, ProjectCreate, ProjectGene, ProjectGeneCreate } from '@/types'

export function fetchProjects(search?: string) {
  return client.get<Project[]>('/projects', {
    params: search ? { search } : undefined,
  })
}

export function fetchProject(id: number) {
  return client.get<Project>(`/projects/${id}`)
}

export function createProject(data: ProjectCreate) {
  return client.post<Project>('/projects', data)
}

export function updateProject(id: number, data: Partial<ProjectCreate>) {
  return client.put<Project>(`/projects/${id}`, data)
}

export function deleteProject(id: number) {
  return client.delete(`/projects/${id}`)
}

export function reorderProjects(orderedIds: number[]) {
  return client.put('/projects/reorder', { ordered_ids: orderedIds })
}

export function moveProjectSortOrder(id: number, sortOrder: number) {
  return client.put(`/projects/${id}/sort-order`, { sort_order: sortOrder })
}

export function addProjectPrimer(projectId: number, primerId: number) {
  return client.post(`/projects/${projectId}/primers`, { primer_id: primerId })
}

export function removeProjectPrimer(projectId: number, primerId: number) {
  return client.delete(`/projects/${projectId}/primers/${primerId}`)
}

export function fetchProjectGenes(projectId: number) {
  return client.get<ProjectGene[]>(`/projects/${projectId}/genes`)
}

export function createProjectGene(projectId: number, data: ProjectGeneCreate) {
  return client.post<ProjectGene>(`/projects/${projectId}/genes`, data)
}

export function updateProjectGene(projectId: number, geneId: number, data: Partial<ProjectGeneCreate>) {
  return client.put<ProjectGene>(`/projects/${projectId}/genes/${geneId}`, data)
}

export function deleteProjectGene(projectId: number, geneId: number) {
  return client.delete(`/projects/${projectId}/genes/${geneId}`)
}

export function reorderProjectGenes(projectId: number, geneIds: number[]) {
  return client.put(`/projects/${projectId}/genes/reorder`, { gene_ids: geneIds })
}
