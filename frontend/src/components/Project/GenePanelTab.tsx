import { useState, useCallback, useEffect } from 'react'
import type { ProjectGene } from '@/types'
import { createProjectGene, updateProjectGene, deleteProjectGene } from '@/api/projects'
import Modal from '@/components/common/Modal'

interface Props {
  readonly projectId: number
  readonly genes: ProjectGene[]
  readonly onRefresh: () => void
}

export default function GenePanelTab({ projectId, genes, onRefresh }: Props) {
  const [editGene, setEditGene] = useState<ProjectGene | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const channels = [...new Set(genes.map((g) => g.fluorescence_channel).filter(Boolean))] as string[]
  const tubeNumbers = [...new Set(genes.map((g) => g.tube_number).filter((n): n is number => n !== null))].sort((a, b) => a - b)

  const getGene = useCallback(
    (channel: string, tubeNum: number) =>
      genes.find((g) => g.fluorescence_channel === channel && g.tube_number === tubeNum),
    [genes],
  )

  const handleDeleteGene = useCallback(async (geneId: number) => {
    await deleteProjectGene(projectId, geneId)
    onRefresh()
  }, [projectId, onRefresh])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">基因面板</h3>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setShowAdd(true)}>
            添加基因
          </button>
        </div>
      </div>

      {channels.length === 0 || tubeNumbers.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">点击"添加基因"开始构建面板</p>
      ) : (
        <GeneGrid
          channels={channels}
          tubeNumbers={tubeNumbers}
          getGene={getGene}
          onCellClick={setEditGene}
          onDelete={handleDeleteGene}
        />
      )}

      <GeneEditModal
        open={editGene !== null}
        projectId={projectId}
        gene={editGene}
        onClose={() => setEditGene(null)}
        onSuccess={onRefresh}
      />

      <GeneAddModal
        open={showAdd}
        projectId={projectId}
        onClose={() => setShowAdd(false)}
        onSuccess={onRefresh}
      />
    </div>
  )
}

function GeneGrid({ channels, tubeNumbers, getGene, onCellClick, onDelete }: {
  readonly channels: string[]
  readonly tubeNumbers: number[]
  readonly getGene: (channel: string, num: number) => ProjectGene | undefined
  readonly onCellClick: (gene: ProjectGene) => void
  readonly onDelete: (geneId: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-500">
              荧光通道
            </th>
            {tubeNumbers.map((n) => (
              <th key={n} className="border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-500">
                管 {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map((ch) => (
            <tr key={ch}>
              <td className="border border-slate-200 px-3 py-2 font-medium text-xs bg-slate-50">{ch}</td>
              {tubeNumbers.map((num) => {
                const gene = getGene(ch, num)
                return (
                  <td key={num} className="border border-slate-200 px-2 py-1 text-center">
                    {gene ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onCellClick(gene)}
                          className="text-sm hover:text-blue-600"
                        >
                          {gene.gene_name}
                        </button>
                        <button type="button" onClick={() => onDelete(gene.id)} className="text-slate-300 hover:text-red-500 text-xs">x</button>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GeneEditModal({ open, projectId, gene, onClose, onSuccess }: {
  readonly open: boolean
  readonly projectId: number
  readonly gene: ProjectGene | null
  readonly onClose: () => void
  readonly onSuccess: () => void
}) {
  const [name, setName] = useState(gene?.gene_name ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setName(gene?.gene_name ?? '')
  }, [gene])

  const handleSubmit = useCallback(async () => {
    if (!gene) return
    setSubmitting(true)
    await updateProjectGene(projectId, gene.id, { gene_name: name })
    onSuccess()
    onClose()
    setSubmitting(false)
  }, [projectId, gene, name, onSuccess, onClose])

  return (
    <Modal open={open} title="编辑基因" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">基因名称</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={submitting} onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </Modal>
  )
}

function GeneAddModal({ open, projectId, onClose, onSuccess }: {
  readonly open: boolean
  readonly projectId: number
  readonly onClose: () => void
  readonly onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('')
  const [tubeNum, setTubeNum] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name) return
    setSubmitting(true)
    await createProjectGene(projectId, {
      gene_name: name,
      fluorescence_channel: channel || undefined,
      tube_number: tubeNum ? parseInt(tubeNum) : undefined,
    })
    setName(''); setChannel(''); setTubeNum('')
    onSuccess()
    onClose()
    setSubmitting(false)
  }, [projectId, name, channel, tubeNum, onSuccess, onClose])

  return (
    <Modal open={open} title="添加基因" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">基因名称 *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="如: FCGRA, GBP5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">荧光通道</label>
          <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)} className="input-field" placeholder="如: 5'6-FAM, VIC, ROX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">管号</label>
          <input type="number" value={tubeNum} onChange={(e) => setTubeNum(e.target.value)} className="input-field" placeholder="如: 1, 2, 3" min="1" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={!name || submitting} onClick={handleSubmit}>添加</button>
        </div>
      </div>
    </Modal>
  )
}
