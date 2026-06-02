import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { useRuleVersions, useRollbackRule } from '../../hooks/useKnowledge';
import type { KnowledgeRule } from '../../types';

/** 版本历史面板属性 */
interface VersionHistoryPanelProps {
  /** 关联的规则 */
  rule: KnowledgeRule;
  /** 是否打开面板 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 版本历史面板组件
 *
 * 使用 Sheet 抽屉形式展示规则的所有历史版本。
 * 支持展开查看快照内容、回滚到指定版本（带确认对话框）。
 */
export default function VersionHistoryPanel({ rule, open, onClose }: VersionHistoryPanelProps) {
  const { t } = useTranslation();
  const { data: versions, isLoading } = useRuleVersions(open ? rule.id : null);
  const rollbackMutation = useRollbackRule();

  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<{ version: number; summary: string } | null>(null);

  /** 执行回滚 */
  const handleRollback = (version: number) => {
    rollbackMutation.mutate(
      { ruleId: rule.id, version },
      {
        onSuccess: () => {
          setConfirmRollback(null);
        },
      },
    );
  };

  /** 格式化时间显示 */
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('knowledge.versionHistory.title')}
            </SheetTitle>
            <SheetDescription>
              {rule.name} — {t('knowledge.versionHistory.currentVersion', { version: rule.version })}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {isLoading && (
              <div className="py-8 text-center text-muted-foreground">
                {t('common.loading')}
              </div>
            )}

            {!isLoading && (!versions || versions.length === 0) && (
              <div className="py-8 text-center text-muted-foreground">
                {t('knowledge.versionHistory.noHistory')}
              </div>
            )}

            {versions?.map((v) => {
              const isCurrent = v.version === rule.version;
              const isExpanded = expandedVersion === v.version;

              return (
                <div key={v.id} className="border rounded-lg">
                  {/* 版本头部 */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedVersion(isExpanded ? null : v.version)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={isCurrent ? 'default' : 'outline'}>
                        v{v.version}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          {t('knowledge.versionHistory.current')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{v.changedBy ?? t('knowledge.versionHistory.unknownUser')}</span>
                      <span>{formatTime(v.createdAt)}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* 变更摘要 */}
                  {v.changeSummary && (
                    <div className="px-3 pb-2 text-sm text-muted-foreground">
                      {v.changeSummary}
                    </div>
                  )}

                  {/* 展开快照内容 */}
                  {isExpanded && (
                    <>
                      <Separator />
                      <div className="p-3">
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(v.snapshot), null, 2);
                            } catch {
                              return v.snapshot;
                            }
                          })()}
                        </pre>

                        {/* 回滚按钮（非当前版本才显示） */}
                        {!isCurrent && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRollback({
                                  version: v.version,
                                  summary: v.changeSummary ?? '',
                                });
                              }}
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" />
                              {t('knowledge.versionHistory.rollback')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* 回滚确认对话框 */}
      <Dialog open={confirmRollback !== null} onOpenChange={(open) => !open && setConfirmRollback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledge.versionHistory.rollbackConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('knowledge.versionHistory.rollbackConfirm', { version: confirmRollback?.version })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRollback(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRollback && handleRollback(confirmRollback.version)}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? t('common.loading') : t('knowledge.versionHistory.rollback')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
