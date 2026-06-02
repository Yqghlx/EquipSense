import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import {
  useImportPreview,
  useImportRules,
} from '../../hooks/useKnowledge';
import type { ImportPreviewResult, ImportResult } from '../../types';

/** 导入预览对话框属性 */
interface ImportPreviewDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 待导入的文件 */
  file: File | null;
}

/**
 * 导入预览对话框组件
 *
 * 上传文件后先展示预览结果（有效数据 + 错误列表），
 * 用户确认后再执行实际导入。
 */
export default function ImportPreviewDialog({ open, onClose, file }: ImportPreviewDialogProps) {
  const { t } = useTranslation();
  const previewMutation = useImportPreview();
  const importMutation = useImportRules();
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'previewing' | 'previewed' | 'importing' | 'done'>('previewing');

  /** 当文件变化时自动发起预览请求 */
  const handlePreview = () => {
    if (!file) return;
    setStep('previewing');
    previewMutation.mutate(file, {
      onSuccess: (data) => {
        setPreviewResult(data);
        setStep('previewed');
      },
    });
  };

  /** 确认导入 */
  const handleImport = () => {
    if (!file) return;
    setStep('importing');
    importMutation.mutate(file, {
      onSuccess: (data) => {
        setImportResult(data);
        setStep('done');
      },
    });
  };

  /** 关闭并重置状态 */
  const handleClose = () => {
    setPreviewResult(null);
    setImportResult(null);
    setStep('previewing');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            {t('knowledge.importPreview.title')}
          </DialogTitle>
          <DialogDescription>
            {step === 'done'
              ? t('knowledge.importPreview.doneDescription')
              : t('knowledge.importPreview.description')}
          </DialogDescription>
        </DialogHeader>

        {/* 预览阶段：自动触发预览 */}
        {step === 'previewing' && !previewResult && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              {file ? file.name : t('common.noData')}
            </p>
            <Button onClick={handlePreview} disabled={!file || previewMutation.isPending}>
              {previewMutation.isPending ? t('common.loading') : t('knowledge.importPreview.startPreview')}
            </Button>
          </div>
        )}

        {/* 预览结果展示 */}
        {previewResult && (step === 'previewed' || step === 'importing') && (
          <div className="space-y-4">
            {/* 统计摘要 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{t('knowledge.importPreview.totalRows')}:</span>
                <Badge variant="outline">{previewResult.totalRows}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{t('knowledge.importPreview.validCount')}:</span>
                <Badge variant="default" className="bg-green-600">{previewResult.validCount}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">{t('knowledge.importPreview.errorCount')}:</span>
                <Badge variant="destructive">{previewResult.errorCount}</Badge>
              </div>
            </div>

            {/* 有效数据预览列表 */}
            {previewResult.validItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t('knowledge.importPreview.validItems')}</h4>
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">{t('knowledge.importPreview.row')}</th>
                        <th className="px-2 py-1 text-left">{t('knowledge.editDialog.deviceType')}</th>
                        <th className="px-2 py-1 text-left">{t('knowledge.editDialog.ruleName')}</th>
                        <th className="px-2 py-1 text-left">{t('knowledge.conditions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.validItems.slice(0, 20).map((item) => (
                        <tr key={item.rowNumber} className="border-t">
                          <td className="px-2 py-1">{item.rowNumber}</td>
                          <td className="px-2 py-1">{item.deviceType}</td>
                          <td className="px-2 py-1">{item.name}</td>
                          <td className="px-2 py-1 truncate max-w-[200px]">{item.conditions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewResult.validItems.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-1 border-t">
                      {t('knowledge.importPreview.moreItems', { count: previewResult.validItems.length - 20 })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 错误列表 */}
            {previewResult.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-destructive">
                  {t('knowledge.importPreview.errors')}
                </h4>
                <div className="max-h-32 overflow-y-auto border border-destructive/30 rounded-md bg-destructive/5 p-2 space-y-1">
                  {previewResult.errors.map((err, i) => (
                    <p key={i} className="text-xs">
                      <span className="font-medium">#{err.rowNumber}:</span> {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={previewResult.validCount === 0 || importMutation.isPending}
              >
                {importMutation.isPending
                  ? t('common.loading')
                  : t('knowledge.importPreview.confirmImport', { count: previewResult.validCount })}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* 导入完成结果 */}
        {step === 'done' && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('knowledge.importPreview.imported')}: {importResult.imported}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{t('knowledge.importPreview.skipped')}: {importResult.skipped}</span>
              </div>
              {importResult.failed > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{t('knowledge.importPreview.failed')}: {importResult.failed}</span>
                </div>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-destructive/30 rounded-md bg-destructive/5 p-2 space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs">
                    <span className="font-medium">#{err.rowNumber}:</span> {err.message}
                  </p>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>{t('common.confirm')}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
