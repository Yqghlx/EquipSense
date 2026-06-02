import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useTenantsAdmin, useFreezeTenant, useUnfreezeTenant } from '../../hooks/useTenantsAdmin';
import { Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 租户管理列表页
 *
 * system_admin 专用页面，展示所有租户的分页列表，
 * 支持搜索、冻结/解冻操作，点击行跳转详情页。
 */
export default function TenantsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /** 搜索关键词 */
  const [keyword, setKeyword] = useState('');
  /** 当前页码 */
  const [page, setPage] = useState(1);
  /** 每页条数 */
  const pageSize = 20;

  const { data, isLoading } = useTenantsAdmin({ page, pageSize, keyword: keyword || undefined });
  const freezeMutation = useFreezeTenant();
  const unfreezeMutation = useUnfreezeTenant();

  /** 状态对应的徽章样式 */
  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Frozen':
        return 'destructive';
      case 'Trial':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  /** 处理冻结/解冻操作 */
  const handleToggleFreeze = (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation(); // 阻止行点击跳转
    if (status === 'Frozen') {
      unfreezeMutation.mutate(id);
    } else {
      freezeMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('admin.tenants.title')}</h1>
        </div>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('admin.tenants.searchPlaceholder')}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1); // 搜索时重置到第一页
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 租户列表表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.tenants.columns.name')}</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>{t('admin.tenants.columns.plan')}</TableHead>
                <TableHead>{t('admin.tenants.columns.status')}</TableHead>
                <TableHead className="text-right">{t('admin.tenants.columns.devices')}</TableHead>
                <TableHead className="text-right">{t('admin.tenants.columns.users')}</TableHead>
                <TableHead>{t('admin.tenants.columns.createdAt')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : !data?.items?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  >
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(tenant.status)}>
                        {t(`admin.tenants.status.${tenant.status.toLowerCase()}`, tenant.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant.currentDeviceCount}/{tenant.maxDevices}
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant.currentUserCount}/{tenant.maxUsers}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={tenant.status === 'Frozen' ? 'outline' : 'destructive'}
                        onClick={(e) => handleToggleFreeze(e, tenant.id, tenant.status)}
                        disabled={freezeMutation.isPending || unfreezeMutation.isPending}
                      >
                        {tenant.status === 'Frozen'
                          ? t('admin.tenants.unfreeze')
                          : t('admin.tenants.freeze')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页控件 */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.totalItems', { count: data.total })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {Math.ceil(data.total / pageSize)}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= Math.ceil(data.total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
