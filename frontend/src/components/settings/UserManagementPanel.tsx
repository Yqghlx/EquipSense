import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Search, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useChangeUserRole,
  type UserItem,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../../hooks/useUsers';
import { UserFormDialog } from '../user/UserFormDialog';
import { formatDate } from '../../lib/utils';

/**
 * 用户管理面板
 *
 * 展示用户列表，支持创建、编辑、停用用户，变更角色。
 * 对应后端 /api/v1/admin/users 端点。
 */
export function UserManagementPanel() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserItem | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading } = useUsers({ page, pageSize: 20, keyword: keyword || undefined });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const changeUserRole = useChangeUserRole();

  /** 角色中文标签映射 */
  const roleLabels: Record<string, string> = {
    SystemAdmin: t('settings.role.systemAdmin'),
    MaintenanceLead: t('settings.role.maintenanceLead'),
    Technician: t('settings.role.technician'),
    Operator: t('settings.role.operator'),
    Viewer: t('settings.role.viewer'),
  };

  /** 搜索处理：按回车或点击搜索按钮触发 */
  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
  };

  /** 创建/编辑用户提交 */
  const handleFormSubmit = (payload: CreateUserPayload | UpdateUserPayload) => {
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...payload } as UpdateUserPayload & { id: string }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createUser.mutate(payload as CreateUserPayload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  /** 打开编辑对话框 */
  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  /** 打开创建对话框 */
  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  /** 确认停用用户 */
  const confirmDeactivate = () => {
    if (deactivateTarget) {
      deactivateUser.mutate(deactivateTarget.id, {
        onSuccess: () => setDeactivateTarget(null),
      });
    }
  };

  /** 确认变更角色 */
  const confirmRoleChange = () => {
    if (roleChangeTarget && newRole) {
      changeUserRole.mutate({ id: roleChangeTarget.id, role: newRole }, {
        onSuccess: () => setRoleChangeTarget(null),
      });
    }
  };

  const isSubmitting = createUser.isPending || updateUser.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.users')}</CardTitle>
              <CardDescription>{t('settings.manageUserAccounts')}</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              {t('settings.user.createUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="flex gap-2 mb-4">
            <Input
              className="max-w-xs"
              placeholder={t('settings.user.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 用户列表 */}
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings.username')}</TableHead>
                    <TableHead>{t('settings.user.displayName')}</TableHead>
                    <TableHead>{t('settings.roleLabel')}</TableHead>
                    <TableHead>{t('settings.user.contact')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.createdAt')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.displayName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabels[user.role] ?? user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email || user.phone || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? t('common.enabled') : t('common.disabled')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => openEdit(user)}
                              title={t('common.edit')}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => { setRoleChangeTarget(user); setNewRole(user.role); }}
                              title={t('settings.user.changeRole')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
                            </Button>
                            {user.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                onClick={() => setDeactivateTarget(user)}
                                title={t('settings.user.deactivate')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 分页 */}
              {data && data.total > 20 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                  <span>{t('common.totalItems', { count: data.total })}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      {t('common.previous')}
                    </Button>
                    <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>
                      {t('common.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑用户对话框 */}
      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editingUser}
        onSubmit={handleFormSubmit}
        submitting={isSubmitting}
      />

      {/* 停用用户确认对话框 */}
      <Dialog open={!!deactivateTarget} onOpenChange={(v) => { if (!v) setDeactivateTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.user.deactivate')}</DialogTitle>
            <DialogDescription>
              {t('settings.user.deactivateConfirm', { username: deactivateTarget?.username })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDeactivate} disabled={deactivateUser.isPending}>
              {deactivateUser.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 变更角色对话框 */}
      <Dialog open={!!roleChangeTarget} onOpenChange={(v) => { if (!v) setRoleChangeTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.user.changeRole')}</DialogTitle>
            <DialogDescription>
              {t('settings.user.changeRoleDesc', { username: roleChangeTarget?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={(v) => { if (v) setNewRole(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>{t('common.cancel')}</Button>
            <Button onClick={confirmRoleChange} disabled={changeUserRole.isPending || !newRole}>
              {changeUserRole.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
