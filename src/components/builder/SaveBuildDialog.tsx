import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'

interface SaveBuildDialogProps {
  open: boolean
  onClose: () => void
  onNeedAuth: () => void
}

export function SaveBuildDialog({ open, onClose, onNeedAuth }: SaveBuildDialogProps) {
  const { build, setBuildName, loadBuild } = useBuildStore()
  const { saveBuild } = useGarageStore()
  const { isAuthenticated, user } = useAuthStore()
  const { success } = useToast()

  const [name, setName] = useState(build.name)
  const [description, setDescription] = useState(build.description ?? '')
  const [isPublic, setIsPublic] = useState(build.isPublic)

  useEffect(() => {
    if (open) {
      setName(build.name)
      setDescription(build.description ?? '')
      setIsPublic(build.isPublic)
    }
  }, [open, build])

  const handleSave = () => {
    if (!isAuthenticated) {
      onClose()
      onNeedAuth()
      return
    }
    setBuildName(name)
    const saved = saveBuild({
      ...build,
      name,
      description,
      isPublic,
      ownerName: user?.displayName,
    })
    loadBuild(saved)
    success('Build saved!')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Save Build" className="max-w-md w-full">
      <div className="p-6 space-y-4">
        <Input
          label="Build name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <span className="text-sm font-medium text-text-secondary">Bike type</span>
          <p className="mt-1 text-sm text-text-primary capitalize">{build.bikeType}</p>
        </div>
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about your build…"
          rows={3}
        />
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">Visibility</label>
          <div className="flex gap-3">
            {(['public', 'private'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setIsPublic(v === 'public')}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                  (v === 'public') === isPublic
                    ? 'bg-accent text-white border-accent'
                    : 'bg-transparent text-text-secondary border-border-default hover:border-border-strong'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">Save build</Button>
      </div>
    </Modal>
  )
}
