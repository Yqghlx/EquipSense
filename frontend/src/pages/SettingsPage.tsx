import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

/** 系统角色列表 */
const roles = ['system_admin', 'maintenance_lead', 'technician', 'operator', 'viewer'];

/** 权限模块列表 */
const permissions = ['设备管理', '告警管理', '工单管理', '知识库', '报表', 'AI 分析'];

/**
 * RBAC 权限矩阵（只读展示）
 *
 * 对应 CLAUDE.md 中定义的权限矩阵，五个角色 × 六个模块。
 */
const rbacMatrix: Record<string, Record<string, string>> = {
  system_admin:     { '设备管理': 'CRUD', '告警管理': 'CRUD', '工单管理': 'CRUD', '知识库': 'CRUD', '报表': 'R', 'AI 分析': 'CRUD' },
  maintenance_lead: { '设备管理': 'RW', '告警管理': 'RW+配置', '工单管理': 'RW+派工验收', '知识库': 'RW+验证', '报表': 'R', 'AI 分析': 'R' },
  technician:       { '设备管理': 'R', '告警管理': 'R+确认', '工单管理': 'R+执行', '知识库': 'R', '报表': '-', 'AI 分析': 'R+查询' },
  operator:         { '设备管理': 'R', '告警管理': 'R+确认', '工单管理': 'R', '知识库': '-', '报表': 'R', 'AI 分析': 'R+查询' },
  viewer:           { '设备管理': 'R', '告警管理': 'R', '工单管理': 'R', '知识库': 'R', '报表': 'R', 'AI 分析': '-' },
};

/** 角色对应的中文标签 */
const roleLabels: Record<string, string> = {
  system_admin: '系统管理员',
  maintenance_lead: '维保主管',
  technician: '技术员',
  operator: '操作员',
  viewer: '观察者',
};

/**
 * 系统设置页面
 *
 * 采用 Tab 布局，包含四个面板：
 * - 用户管理：管理用户账号（待后端 API 实现）
 * - 角色权限：展示 RBAC 权限矩阵（只读）
 * - LLM 配置：配置 AI 服务参数
 * - 系统参数：全局系统参数配置
 */
export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t('settings.users')}</TabsTrigger>
          <TabsTrigger value="roles">{t('settings.roles')}</TabsTrigger>
          <TabsTrigger value="llm">{t('settings.llm')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.system')}</TabsTrigger>
        </TabsList>

        {/* 用户管理 */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.users')}</CardTitle>
              <CardDescription>管理系统用户账号</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      用户管理功能需要后端 /api/v1/users API 完整实现
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 角色权限矩阵（只读） */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.roles')}</CardTitle>
              <CardDescription>RBAC 权限矩阵（只读）</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>权限 / 角色</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role}>{roleLabels[role]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm}>
                      <TableCell className="font-medium">{perm}</TableCell>
                      {roles.map((role) => (
                        <TableCell key={role}>
                          <Badge variant="outline" className={
                            rbacMatrix[role][perm].includes('CRUD') ? 'border-green-500/30 text-green-500' :
                            rbacMatrix[role][perm].includes('RW') ? 'border-blue-500/30 text-blue-500' :
                            rbacMatrix[role][perm] === 'R' ? 'border-gray-500/30 text-gray-500' :
                            'border-red-500/30 text-red-500'
                          }>
                            {rbacMatrix[role][perm]}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM 配置 */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.llm')}</CardTitle>
              <CardDescription>配置 LLM 服务参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>模型 ID</Label>
                  <Input defaultValue="glm-5" placeholder="模型标识" />
                </div>
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input defaultValue="https://dashscope.aliyuncs.com/api/v1" placeholder="API 端点" />
                </div>
                <div className="space-y-2">
                  <Label>超时时间（秒）</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>最大 Token 数</Label>
                  <Input type="number" defaultValue="4096" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>{t('common.save')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统参数 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.system')}</CardTitle>
              <CardDescription>全局系统参数配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>告警冷却时间（秒）</Label>
                  <Input type="number" defaultValue="300" />
                </div>
                <div className="space-y-2">
                  <Label>聚合窗口（分钟）</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>最大聚合次数</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>数据保留天数</Label>
                  <Input type="number" defaultValue="90" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>{t('common.save')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
