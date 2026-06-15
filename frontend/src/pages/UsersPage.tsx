/**
 * 用户管理页面
 *
 * 系统管理员管理本租户的用户：列表查看、创建用户、变更角色、停用账户。
 * 对接 useUsers hook（GET/POST/PUT/DELETE /admin/users）。
 *
 * RBAC：仅 SystemAdmin 可访问（路由层已限制）。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, UserPlus } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  useUsers, useCreateUser, useDeactivateUser, useChangeUserRole,
  type UserItem, type CreateUserPayload,
} from '../hooks/useUsers';
import { formatDate } from '../lib/utils';

/** 角色中文标签 */
const roleLabels: Record<string, string> = {
  SystemAdmin: '系统管理员',
  MaintenanceLead: '维保主管',
  Technician: '技术员',
  Operator: '操作员',
  Viewer: '观察者',
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useUsers({ page, pageSize: 20, keyword });
  const createUser = useCreateUser();
  const deactivateUser = useDeactivateUser();
  const changeRole = useChangeUserRole();

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t('users.title', '用户管理')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('users.description', '管理本租户的用户账户、角色和启用状态')}
          </p>
        </div>
        {/* 创建用户入口 — 点击打开 CreateUserDialog。SystemAdmin 专属（页面本身已受路由权限保护） */}
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          {t('users.createUser', '创建用户')}
        </Button>
        <CreateUserDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={async (payload) => {
            await createUser.mutateAsync(payload);
            setCreateOpen(false);
          }}
          loading={createUser.isPending}
        />
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Input
            placeholder={t('users.searchPlaceholder', '搜索用户名/姓名...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            {t('common.search', '搜索')}
          </Button>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.username', '用户名')}</TableHead>
                <TableHead>{t('users.displayName', '姓名')}</TableHead>
                <TableHead>{t('users.role', '角色')}</TableHead>
                <TableHead>{t('users.email', '邮箱')}</TableHead>
                <TableHead>{t('users.status', '状态')}</TableHead>
                <TableHead>{t('users.createdAt', '创建时间')}</TableHead>
                <TableHead className="text-right">{t('common.actions', '操作')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t('common.loading', '加载中...')}
                  </TableCell>
                </TableRow>
              ) : data && data.items.length > 0 ? (
                data.items.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={(role) => changeRole.mutate({ id: user.id, role })}
                    onToggleActive={async () => {
                      if (user.isActive) {
                        if (confirm(t('users.confirmDeactivate', '确定停用该用户？停用后无法登录'))) {
                          await deactivateUser.mutateAsync(user.id);
                        }
                      }
                    }}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t('common.noData', '暂无数据')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.totalItems', '共 {{count}} 条', { count: data.total })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              {t('common.previous', '上一页')}
            </Button>
            <span className="flex items-center px-3 text-sm">{page}</span>
            <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>
              {t('common.next', '下一页')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 单行用户，含角色下拉切换 + 停用按钮 */
function UserRow({
  user, onRoleChange, onToggleActive,
}: {
  user: UserItem;
  onRoleChange: (role: string) => void;
  onToggleActive: () => void;
}) {
  const { t } = useTranslation();
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{user.username}</TableCell>
      <TableCell className="text-sm">{user.displayName || '-'}</TableCell>
      <TableCell>
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={user.role}
          onChange={(e) => onRoleChange(e.target.value)}
          title={t('users.changeRole', '变更角色')}
        >
          {Object.entries(roleLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{user.email || '-'}</TableCell>
      <TableCell>
        <Badge className={user.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
          {user.isActive ? t('users.active', '启用') : t('users.inactive', '停用')}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
      <TableCell className="text-right">
        {user.isActive && (
          <Button variant="ghost" size="sm" className="text-red-600" onClick={onToggleActive}>
            {t('users.deactivate', '停用')}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

/** 创建用户对话框 */
function CreateUserDialog({
  open, onOpenChange, onCreate, loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (payload: CreateUserPayload) => Promise<void>;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateUserPayload>({
    username: '', password: '', displayName: '', role: 'Technician', email: '', phone: '',
  });

  const handleSubmit = async () => {
    if (!form.username || !form.password) return;
    await onCreate(form);
    setForm({ username: '', password: '', displayName: '', role: 'Technician', email: '', phone: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('users.createUser', '创建用户')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>{t('users.username', '用户名')} *</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t('users.password', '初始密码')} *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t('users.displayName', '姓名')}</Label>
            <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t('users.role', '角色')}</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t('users.email', '邮箱')}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', '取消')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.username || !form.password}>
            {loading ? t('common.loading', '加载中...') : t('common.create', '创建')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
