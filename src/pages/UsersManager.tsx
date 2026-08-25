import { useState } from 'react'
import { KeyRound, Plus, Save, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { trpc } from '@/providers/trpc'

type Role = 'user' | 'admin'

export default function UsersManager() {
  const utils = trpc.useUtils()
  const accounts = trpc.accounts.list.useQuery()
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'user' as Role,
    isActive: true,
  })
  const [edits, setEdits] = useState<Record<number, { username: string; fullName: string; email: string; role: Role; isActive: boolean }>>({})
  const [passwords, setPasswords] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState('')

  const invalidate = () => utils.accounts.list.invalidate()
  const errorMessage = (message?: string) =>
    message === 'username_taken'
      ? 'Este nome de usuário já está em uso.'
      : message === 'last_admin_protected'
        ? 'Não é possível remover ou desativar o último administrador ativo.'
        : 'Não foi possível salvar.'

  const create = trpc.accounts.create.useMutation({
    onSuccess: () => {
      setFeedback('Usuário criado.')
      setForm({ username: '', fullName: '', email: '', password: '', role: 'user', isActive: true })
      invalidate()
    },
    onError: (error) => setFeedback(errorMessage(error.message)),
  })
  const update = trpc.accounts.update.useMutation({
    onSuccess: invalidate,
    onError: (error) => setFeedback(errorMessage(error.message)),
  })
  const resetPassword = trpc.accounts.resetPassword.useMutation({
    onSuccess: (_data, variables) => {
      setPasswords((current) => ({ ...current, [variables.id]: '' }))
      setFeedback('Senha redefinida.')
    },
    onError: () => setFeedback('Não foi possível redefinir a senha.'),
  })
  const remove = trpc.accounts.remove.useMutation({
    onSuccess: invalidate,
    onError: (error) => setFeedback(errorMessage(error.message)),
  })

  const rows = accounts.data ?? []

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-serif-display text-2xl font-semibold">
            <Users className="h-5 w-5 text-primary" /> Usuários
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie e gerencie contas que acessam o painel pelo login atual.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Usuário</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Senha inicial</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <label className="flex items-center gap-3 pt-6 text-sm font-medium">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              Ativo
            </label>
          </div>
          <Button
            className="mt-4 bg-primary text-primary-foreground"
            disabled={create.isPending || form.username.length < 3 || form.password.length < 8 || form.fullName.length < 2}
            onClick={() =>
              create.mutate({
                ...form,
                email: form.email || null,
              })
            }
          >
            <Plus className="me-1.5 h-4 w-4" /> Novo usuário
          </Button>
          {feedback && <p className="mt-3 text-sm text-primary">{feedback}</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((row) => {
          const edit = edits[row.id] ?? {
            username: row.username,
            fullName: row.fullName,
            email: row.email ?? '',
            role: row.role,
            isActive: row.isActive,
          }
          return (
            <Card key={row.id}>
              <CardContent className="p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input value={edit.fullName} onChange={(e) => setEdits({ ...edits, [row.id]: { ...edit, fullName: e.target.value } })} />
                  <Input value={edit.username} onChange={(e) => setEdits({ ...edits, [row.id]: { ...edit, username: e.target.value } })} />
                  <Input value={edit.email} onChange={(e) => setEdits({ ...edits, [row.id]: { ...edit, email: e.target.value } })} />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={edit.role}
                      onChange={(e) => setEdits({ ...edits, [row.id]: { ...edit, role: e.target.value as Role } })}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <Switch checked={edit.isActive} onCheckedChange={(v) => setEdits({ ...edits, [row.id]: { ...edit, isActive: v } })} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{row.role}</span>
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: row.id, ...edit, email: edit.email || null })}>
                    <Save className="me-1.5 h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Input
                    className="h-8 w-48"
                    type="password"
                    placeholder="Nova senha"
                    value={passwords[row.id] ?? ''}
                    onChange={(e) => setPasswords({ ...passwords, [row.id]: e.target.value })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(passwords[row.id] ?? '').length < 8}
                    onClick={() => resetPassword.mutate({ id: row.id, password: passwords[row.id] })}
                  >
                    <KeyRound className="me-1.5 h-3.5 w-3.5" /> Redefinir senha
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate({ id: row.id })}>
                    <Trash2 className="me-1.5 h-3.5 w-3.5 text-destructive" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
