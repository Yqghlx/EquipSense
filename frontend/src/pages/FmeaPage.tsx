import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Pencil, Plus, Power, PowerOff, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  useFmeaEntries, useDeleteFmeaEntry, useToggleFmeaEntry,
  type FmeaEntry,
} from '../hooks/useFmea';
import { usePermission } from '../hooks/usePermission';
import FmeaFormDialog from '../components/fmea/FmeaFormDialog';
import { getFmeaRpnColor } from '../lib/fmeaRisk';

export default function FmeaPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FmeaEntry | null>(null);

  const perm = usePermission('knowledge');
  const { data, isLoading } = useFmeaEntries(
    { page, pageSize: 20, deviceType: deviceTypeFilter || undefined },
    { enabled: perm.canRead },
  );
  const deleteMutation = useDeleteFmeaEntry();
  const toggleMutation = useToggleFmeaEntry();

  if (!perm.canRead) {
    return (
      <div role="alert" className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
        {t('fmea.noReadPermission')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            {t('fmea.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('fmea.description')}</p>
        </div>
        {perm.canCreate && (
          <Button
            onClick={() => {
              setEditingEntry(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            {t('fmea.create')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('fmea.filterByDeviceType')}
              value={deviceTypeFilter}
              onChange={(e) => { setDeviceTypeFilter(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fmea.deviceType')}</TableHead>
                <TableHead>{t('fmea.failureMode')}</TableHead>
                <TableHead>{t('fmea.cause')}</TableHead>
                <TableHead>{t('fmea.effect')}</TableHead>
                <TableHead className="text-center">{t('fmea.severity')}</TableHead>
                <TableHead className="text-center">{t('fmea.occurrence')}</TableHead>
                <TableHead className="text-center">{t('fmea.detectability')}</TableHead>
                <TableHead className="text-center">{t('fmea.rpn')}</TableHead>
                <TableHead className="text-center">{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="py-12 text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
              ) : data && data.items.length > 0 ? (
                data.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.deviceType}</TableCell>
                    <TableCell>{entry.failureMode}</TableCell>
                    <TableCell>{entry.cause}</TableCell>
                    <TableCell>{entry.effect}</TableCell>
                    <TableCell className="text-center">{entry.severity}</TableCell>
                    <TableCell className="text-center">{entry.occurrence}</TableCell>
                    <TableCell className="text-center">{entry.detectability}</TableCell>
                    <TableCell className="text-center"><Badge className={getFmeaRpnColor(entry.rpn)}>{entry.rpn}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant={entry.isEnabled ? 'default' : 'secondary'}>{entry.isEnabled ? t('common.enabled') : t('common.disabled')}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {perm.canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t('fmea.editAction')}
                              title={t('fmea.editAction')}
                              onClick={() => {
                                setEditingEntry(entry);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={entry.isEnabled ? t('fmea.disableAction') : t('fmea.enableAction')}
                              title={entry.isEnabled ? t('fmea.disableAction') : t('fmea.enableAction')}
                              onClick={() => toggleMutation.mutate(entry.id)}
                            >
                            {entry.isEnabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                        {perm.canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('fmea.deleteAction')}
                            title={t('fmea.deleteAction')}
                            onClick={() => { if (confirm(t('fmea.confirmDelete'))) deleteMutation.mutate(entry.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={10} className="py-12 text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('common.totalItems', { count: data.total })}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('common.previous')}</Button>
            <span className="flex items-center px-3 text-sm">{page} / {Math.ceil(data.total / 20)}</span>
            <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>{t('common.next')}</Button>
          </div>
        </div>
      )}

      <FmeaFormDialog
        open={formOpen}
        entry={editingEntry}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEntry(null);
        }}
      />
    </div>
  );
}
