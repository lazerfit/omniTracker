'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExchangeBalance {
  exchange: string;
  balanceKrw: number;
  error?: string;
}

interface StockBalance {
  ticker: string;
  name: string;
  shares: number;
  priceKrw: number;
  totalKrw: number;
  error?: string;
}

interface PortfolioBalanceResponse {
  total: number;
  currency: string;
  exchanges: ExchangeBalance[];
  stocks: StockBalance[];
}

interface TargetItem {
  assetKey: string;
  targetPct: number;
}

interface AssetRow {
  assetKey: string;
  label: string;
  sublabel?: string;
  category: 'crypto' | 'stock';
  currentKrw: number;
}

interface Preset {
  id: number;
  name: string;
  targetsJson: string;
  createdAt: string;
}

function formatKrw(v: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(v);
}

export default function RebalancingPage() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [balanceRes, targetsRes, presetsRes] = await Promise.all([
          fetch('/api/portfolio/balance'),
          fetch('/api/portfolio-rebalance-targets'),
          fetch('/api/rebalance-presets'),
        ]);

        if (!balanceRes.ok) throw new Error('Failed to fetch portfolio balance');
        if (!targetsRes.ok) throw new Error('Failed to fetch rebalance targets');
        if (!presetsRes.ok) throw new Error('Failed to fetch rebalance presets');

        const balanceData = (await balanceRes.json()) as PortfolioBalanceResponse;
        const targetsData = (await targetsRes.json()) as TargetItem[];
        const presetsData = (await presetsRes.json()) as Preset[];

        const rows: AssetRow[] = [];

        for (const ex of balanceData.exchanges) {
          if (ex.balanceKrw > 0 && !ex.error) {
            rows.push({
              assetKey: `exchange:${ex.exchange}`,
              label: ex.exchange,
              category: 'crypto',
              currentKrw: ex.balanceKrw,
            });
          }
        }

        for (const st of balanceData.stocks) {
          if (st.totalKrw > 0 && !st.error) {
            rows.push({
              assetKey: `stock:${st.ticker}`,
              label: st.ticker,
              sublabel: st.name,
              category: 'stock',
              currentKrw: st.totalKrw,
            });
          }
        }

        setAssets(rows);
        setTotal(balanceData.total);
        setPresets(presetsData);

        const initialTargets: Record<string, string> = {};
        for (const row of rows) {
          initialTargets[row.assetKey] = '';
        }
        for (const t of targetsData) {
          if (t.targetPct !== 0) {
            initialTargets[t.assetKey] = String(t.targetPct);
          }
        }
        setTargets(initialTargets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const targetSum = Object.values(targets).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  async function handleSavePreset() {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    try {
      const payload = assets.map((a) => ({
        assetKey: a.assetKey,
        targetPct: parseFloat(targets[a.assetKey] ?? '') || 0,
      }));
      const res = await fetch('/api/rebalance-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: presetName.trim(), targets: payload }),
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = (await res.json()) as { id: number; name: string };
      // Also save as current targets
      await fetch('/api/portfolio-rebalance-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: payload }),
      });
      // Create notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '리밸런싱 저장됨',
          body: `'${saved.name}' 프리셋이 저장되었습니다.`,
        }),
      });
      // Refresh presets
      const presetsRes = await fetch('/api/rebalance-presets');
      setPresets((await presetsRes.json()) as Preset[]);
      // Toast
      toast.success(`'${saved.name}' 프리셋이 저장되었습니다.`);
      setSaveDialogOpen(false);
      setPresetName('');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSavingPreset(false);
    }
  }

  function loadPreset(preset: Preset) {
    try {
      const items = JSON.parse(preset.targetsJson) as { assetKey: string; targetPct: number }[];
      const newTargets: Record<string, string> = { ...targets };
      for (const item of items) {
        newTargets[item.assetKey] = item.targetPct > 0 ? String(item.targetPct) : '';
      }
      setTargets(newTargets);
      toast.success(`'${preset.name}' 프리셋을 불러왔습니다.`);
    } catch {
      toast.error('프리셋을 불러오는데 실패했습니다.');
    }
  }

  async function deletePreset(id: number) {
    await fetch(`/api/rebalance-presets/${id}`, { method: 'DELETE' });
    setPresets((prev) => prev.filter((p) => p.id !== id));
    toast.success('프리셋이 삭제되었습니다.');
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">리밸런싱</h1>
        <p className="text-muted-foreground text-sm">전체 포트폴리오 목표 비중을 설정하세요.</p>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">총 포트폴리오</p>
          <p className="text-lg font-semibold">{formatKrw(total)}</p>
        </div>
        <div className="rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">목표 합계</p>
          <p
            className={cn(
              'text-lg font-semibold',
              Math.abs(targetSum - 100) < 0.01 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {targetSum.toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {/* Load preset dropdown */}
          {presets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/30">
                  불러오기
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/30"
                  >
                    <button
                      className="flex-1 cursor-pointer text-left text-sm"
                      onClick={() => loadPreset(preset)}
                    >
                      {preset.name}
                    </button>
                    <button
                      className="text-muted-foreground ml-2 cursor-pointer text-xs hover:text-red-500"
                      onClick={() => void deletePreset(preset.id)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Save preset button */}
          <button
            onClick={() => setSaveDialogOpen(true)}
            className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/30"
          >
            목표 저장
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-muted/50">
              {['자산', '카테고리', '현재금액', '현재비중', '목표비중', '필요금액', '액션'].map(
                (col) => (
                  <th
                    key={col}
                    className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const currentPct = total > 0 ? (asset.currentKrw / total) * 100 : 0;
              const targetPct = parseFloat(targets[asset.assetKey] ?? '') || 0;
              const targetKrw = (targetPct / 100) * total;
              const diffKrw = targetKrw - asset.currentKrw;

              const isBuy = diffKrw > 1000;
              const isSell = diffKrw < -1000;

              return (
                <tr key={asset.assetKey} className="border-t hover:bg-muted/30">
                  {/* 자산 */}
                  <td className="px-4 py-3">
                    <span className="font-medium">{asset.label}</span>
                    {asset.sublabel && (
                      <span className="text-muted-foreground ml-2 text-xs">{asset.sublabel}</span>
                    )}
                  </td>

                  {/* 카테고리 */}
                  <td className="px-4 py-3">
                    {asset.category === 'crypto' ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                        crypto
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                        stock
                      </span>
                    )}
                  </td>

                  {/* 현재금액 */}
                  <td className="px-4 py-3">{formatKrw(asset.currentKrw)}</td>

                  {/* 현재비중 */}
                  <td className="text-muted-foreground px-4 py-3">
                    {currentPct.toFixed(1)}%
                  </td>

                  {/* 목표비중 input */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-20 rounded border bg-transparent px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={targets[asset.assetKey] ?? ''}
                      onChange={(e) =>
                        setTargets((prev) => ({
                          ...prev,
                          [asset.assetKey]: e.target.value,
                        }))
                      }
                    />
                  </td>

                  {/* 필요금액 */}
                  <td className="px-4 py-3">
                    {isBuy ? (
                      <span className="text-green-500">+{formatKrw(diffKrw)}</span>
                    ) : isSell ? (
                      <span className="text-red-500">{formatKrw(diffKrw)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* 액션 */}
                  <td className="px-4 py-3">
                    {isBuy ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        매수
                      </span>
                    ) : isSell ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        매도
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">유지</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="bg-muted/50 border-t font-medium">
              <td className="px-4 py-3" colSpan={2}>
                합계
              </td>
              <td className="px-4 py-3">{formatKrw(total)}</td>
              <td className="px-4 py-3">100%</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    Math.abs(targetSum - 100) < 0.01 ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {targetSum.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save preset dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>프리셋 저장</DialogTitle>
            <DialogDescription>현재 목표 비중을 이름을 붙여 저장합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="preset-name">프리셋 이름</Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="예: 공격적 포트폴리오"
              className="mt-1.5"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSavePreset();
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="cursor-pointer">
                취소
              </Button>
            </DialogClose>
            <Button
              onClick={() => void handleSavePreset()}
              disabled={savingPreset || !presetName.trim()}
              className="cursor-pointer"
            >
              {savingPreset ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
