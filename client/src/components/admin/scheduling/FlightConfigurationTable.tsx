// ─── Flight Configuration Table — polished card-row layout ──────────────────

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  X,
  Clock,
  Users,
  Trophy,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CalendarDays,
  Pencil,
  FileText,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stringify } from 'csv-stringify/browser/esm/sync';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface FlightConfig {
  id: string;
  divisionName: string;
  startDate: string;
  endDate: string;
  matchCount: number;
  matchTime: number;
  breakTime: number;
  paddingTime: number;
  restPeriod: number;
  totalTime: number;
  formatName: string;
  teamCount: number;
  ageGroupId: number;
  isConfigured: boolean;
  status: 'scheduled' | 'ready' | 'needs_setup';
  scheduledGames: number;
  ageGroup: string;
  gender: string;
  birthYear: string;
  fieldSize: string;
  startingTime: string;
}

interface EditState {
  flightId: string;
  field: string;
  value: string | number;
}

const FIELD_SIZES = ['3v3', '4v4', '5v5', '7v7', '9v9', '11v11'];

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sy = s.getFullYear() === e.getFullYear();
  const sm = sy && s.getMonth() === e.getMonth();
  if (sm) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}, ${e.getFullYear()}`;
  if (sy) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${e.getFullYear()}`;
  return `${fullDate(start)} – ${fullDate(end)}`;
}

function calcTotal(half: number, brk: number, pad: number) {
  return half * 2 + brk + pad;
}

/* ── Micro-components ──────────────────────────────────────────────────────── */

/** A tiny auto-focusing number input with save/cancel */
function NumInput({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: number;
  onChange: (v: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <>
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        className="w-12 h-5 px-1 text-xs text-center bg-slate-900 border border-slate-600 rounded text-white
          focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button onClick={onSave} className="p-0.5 rounded hover:bg-green-500/20"><Check className="h-3 w-3 text-green-400" /></button>
      <button onClick={onCancel} className="p-0.5 rounded hover:bg-red-500/20"><X className="h-3 w-3 text-red-400" /></button>
    </>
  );
}

/** A chip that displays a labeled value; when active=true it shows the edit UI */
function NumberChip({
  label,
  value,
  active,
  editValue,
  onStart,
  onChange,
  onSave,
  onCancel,
}: {
  label: string;
  value: number;
  active: boolean;
  editValue: number;
  onStart: () => void;
  onChange: (v: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 bg-slate-700 rounded-md px-1.5 py-0.5 ring-1 ring-blue-500/40">
        <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">{label}</span>
        <NumInput value={editValue} onChange={onChange} onSave={onSave} onCancel={onCancel} />
      </span>
    );
  }
  return (
    <button
      onClick={onStart}
      className="group/c inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all
        bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white border border-transparent hover:border-slate-600"
      style={{ backgroundColor: 'rgba(51,65,85,.45)' }}
    >
      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider group-hover/c:text-slate-400">
        {label}
      </span>
      <span className="font-mono tabular-nums">{value}</span>
      <Pencil className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover/c:opacity-100 transition-opacity" />
    </button>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */

export function FlightConfigurationTable({ eventId }: { eventId: string }) {
  const [edit, setEdit] = useState<EditState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReadyOnly, setShowReadyOnly] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  /* ── Queries ─────────────────────────────────────────────────────────────── */

  const { data: formatTemplates } = useQuery({
    queryKey: ['format-templates'],
    queryFn: async () => {
      const r = await fetch('/api/admin/matchup-templates');
      if (!r.ok) throw new Error('fetch');
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    },
  });

  const { data: allFlights, isLoading } = useQuery({
    queryKey: ['flight-configurations', eventId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!r.ok) throw new Error('fetch');
      return (await r.json()) as FlightConfig[];
    },
  });

  /* ── Filters ─────────────────────────────────────────────────────────────── */

  const filteredFlights = useMemo(() => {
    if (!allFlights) return [];
    let list = allFlights.filter((f) => f.teamCount > 0);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (f) =>
          f.divisionName.toLowerCase().includes(q) ||
          f.ageGroup.toLowerCase().includes(q) ||
          f.gender.toLowerCase().includes(q) ||
          String(f.birthYear || '').includes(q) ||
          f.formatName.toLowerCase().includes(q),
      );
    }
    if (showReadyOnly) list = list.filter((f) => f.status === 'ready' || f.status === 'scheduled');
    return list;
  }, [allFlights, searchTerm, showReadyOnly]);

  const readyCount = useMemo(
    () => allFlights?.filter((f) => (f.status === 'ready' || f.status === 'scheduled') && f.teamCount > 0).length || 0,
    [allFlights],
  );

  /* ── Mutation ────────────────────────────────────────────────────────────── */

  const mutation = useMutation({
    mutationFn: async ({ flightId, field, value }: { flightId: string; field: string; value: string | number }) => {
      const r = await fetch(`/api/admin/events/${eventId}/flight-configurations/${flightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!r.ok) throw new Error('update');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flight-configurations', eventId] });
      toast({ title: 'Configuration updated' });
      setEdit(null);
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  /* ── Edit helpers ────────────────────────────────────────────────────────── */

  const startEdit = (flightId: string, field: string, value: string | number) =>
    setEdit({ flightId, field, value });

  const save = () => {
    if (edit) mutation.mutate(edit);
  };

  const cancel = () => setEdit(null);

  const is = (fid: string, field: string) => edit?.flightId === fid && edit?.field === field;

  const getFormatOptions = (teamCount: number) =>
    (formatTemplates || [])
      .filter((t: any) => t.teamCount === teamCount)
      .map((t: any) => ({ value: t.name, label: t.name }));

  /* ── CSV ─────────────────────────────────────────────────────────────────── */

  const exportCSV = () => {
    try {
      const rows = filteredFlights.map((f) => ({
        Flight: `${f.gender} ${f.birthYear} - ${f.divisionName}`,
        'Age Group': f.ageGroup,
        Teams: f.teamCount,
        'Field Size': f.fieldSize || '7v7',
        'Start Date': fullDate(f.startDate),
        'End Date': fullDate(f.endDate),
        'Max Games/Day': f.matchCount,
        'Half (min)': f.matchTime,
        'Break (min)': f.breakTime,
        'Buffer (min)': f.paddingTime,
        'Rest (min)': f.restPeriod,
        'Start Time': f.startingTime || '08:00',
        'Total (min)': calcTotal(f.matchTime, f.breakTime, f.paddingTime),
        Format: f.formatName,
        Status: f.status,
        'Scheduled Games': f.scheduledGames || 0,
      }));
      const csv = stringify(rows, { header: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `flights-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast({ title: 'Exported', description: `${rows.length} flights` });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <Loader2 className="animate-spin mr-2 h-5 w-5" />
        <span className="text-sm">Loading flights...</span>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-3">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25">
            <Trophy className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">Flight Configuration Overview</h3>
            <p className="text-[11px] text-slate-500">
              {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} with teams
              {' · '}
              <span className="text-emerald-500">{readyCount} ready</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-40 pl-7 pr-2 text-xs rounded-md bg-slate-800 border border-slate-700
                text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <Select value={showReadyOnly ? 'ready' : 'all'} onValueChange={(v) => setShowReadyOnly(v === 'ready')}>
            <SelectTrigger className="h-7 w-28 text-[11px] bg-slate-800 border-slate-700 text-slate-400">
              <Filter className="h-3 w-3 mr-1 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-xs">All ({filteredFlights.length})</SelectItem>
              <SelectItem value="ready" className="text-xs">Ready ({readyCount})</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={exportCSV}
            variant="outline"
            size="sm"
            className="h-7 text-[11px] px-2.5 border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            disabled={filteredFlights.length === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* ─── Flight list ────────────────────────────────────────────────────── */}
      {filteredFlights.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30">
          <FileText className="h-6 w-6 text-slate-600" />
          <p className="text-xs">No flights found{searchTerm ? ' — try a different search' : ''}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700/60 overflow-hidden">
          {/* Column labels */}
          <div className="flex items-center px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/40">
            <span className="w-56 shrink-0 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Flight
            </span>
            <span className="flex-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Configuration
              <span className="text-slate-600 normal-case tracking-normal font-normal ml-1">(click any value to edit)</span>
            </span>
            <span className="w-56 shrink-0 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Format
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-700/30">
            {filteredFlights.map((f) => {
              const tot = calcTotal(f.matchTime, f.breakTime, f.paddingTime);

              return (
                <div key={f.id} className="flex items-start gap-4 px-4 py-3 hover:bg-slate-800/50 transition-colors">
                  {/* ── Flight identity ─────────────────────────────────────── */}
                  <div className="w-56 shrink-0">
                    <p className="text-[13px] font-semibold text-white leading-tight mb-1">
                      {f.gender} {f.birthYear} – {f.divisionName}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {f.status === 'scheduled' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[10px] font-medium
                          bg-purple-500/15 text-purple-400 border border-purple-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          Scheduled ({f.scheduledGames})
                        </span>
                      ) : f.status === 'ready' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[10px] font-medium
                          bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[10px] font-medium
                          bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Needs setup
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {f.ageGroup} · <Users className="inline h-2.5 w-2.5 -mt-px" /> {f.teamCount}
                      </span>
                    </div>
                  </div>

                  {/* ── Configuration chips ─────────────────────────────────── */}
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
                    {/* Dates */}
                    {is(f.id, 'startDate') ? (
                      <span className="inline-flex items-center gap-1 bg-slate-700 rounded-md px-1.5 py-0.5 ring-1 ring-blue-500/40">
                        <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Start</span>
                        <input
                          type="date"
                          autoFocus
                          value={edit!.value as string}
                          onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                          className="w-28 h-5 px-1 text-xs bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={save} className="p-0.5 rounded hover:bg-green-500/20"><Check className="h-3 w-3 text-green-400" /></button>
                        <button onClick={cancel} className="p-0.5 rounded hover:bg-red-500/20"><X className="h-3 w-3 text-red-400" /></button>
                      </span>
                    ) : is(f.id, 'endDate') ? (
                      <span className="inline-flex items-center gap-1 bg-slate-700 rounded-md px-1.5 py-0.5 ring-1 ring-blue-500/40">
                        <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">End</span>
                        <input
                          type="date"
                          autoFocus
                          value={edit!.value as string}
                          onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                          className="w-28 h-5 px-1 text-xs bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={save} className="p-0.5 rounded hover:bg-green-500/20"><Check className="h-3 w-3 text-green-400" /></button>
                        <button onClick={cancel} className="p-0.5 rounded hover:bg-red-500/20"><X className="h-3 w-3 text-red-400" /></button>
                      </span>
                    ) : (
                      <button
                        onClick={() => startEdit(f.id, 'startDate', f.startDate)}
                        className="group/c inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all
                          hover:bg-slate-700 text-slate-300 hover:text-white border border-transparent hover:border-slate-600"
                        style={{ backgroundColor: 'rgba(51,65,85,.45)' }}
                      >
                        <CalendarDays className="h-3 w-3 text-slate-500" />
                        <span>{dateRange(f.startDate, f.endDate)}</span>
                        <Pencil className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover/c:opacity-100 transition-opacity" />
                      </button>
                    )}

                    <span className="text-slate-700 text-xs">·</span>

                    {/* Field Size */}
                    {is(f.id, 'fieldSize') ? (
                      <span className="inline-flex items-center gap-1 bg-slate-700 rounded-md px-1.5 py-0.5 ring-1 ring-blue-500/40">
                        <Select
                          value={edit!.value as string}
                          onValueChange={(v) => {
                            setEdit(null);
                            mutation.mutate({ flightId: f.id, field: 'fieldSize', value: v });
                          }}
                        >
                          <SelectTrigger className="h-5 w-16 text-[11px] bg-slate-900 border-slate-600 text-white px-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {FIELD_SIZES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button onClick={cancel} className="p-0.5 rounded hover:bg-red-500/20"><X className="h-3 w-3 text-red-400" /></button>
                      </span>
                    ) : (
                      <button
                        onClick={() => startEdit(f.id, 'fieldSize', f.fieldSize || '7v7')}
                        className="group/c inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all font-mono font-semibold
                          hover:bg-slate-700 text-slate-300 hover:text-white border border-transparent hover:border-slate-600"
                        style={{ backgroundColor: 'rgba(51,65,85,.45)' }}
                      >
                        {f.fieldSize || '7v7'}
                        <Pencil className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover/c:opacity-100 transition-opacity" />
                      </button>
                    )}

                    <span className="text-slate-700 text-xs">·</span>

                    {/* Half */}
                    <NumberChip
                      label="Half"
                      value={f.matchTime}
                      active={is(f.id, 'matchTime')}
                      editValue={edit?.field === 'matchTime' ? (edit.value as number) : f.matchTime}
                      onStart={() => startEdit(f.id, 'matchTime', f.matchTime)}
                      onChange={(v) => setEdit(edit ? { ...edit, value: v } : null)}
                      onSave={save}
                      onCancel={cancel}
                    />

                    {/* Break */}
                    <NumberChip
                      label="Brk"
                      value={f.breakTime}
                      active={is(f.id, 'breakTime')}
                      editValue={edit?.field === 'breakTime' ? (edit.value as number) : f.breakTime}
                      onStart={() => startEdit(f.id, 'breakTime', f.breakTime)}
                      onChange={(v) => setEdit(edit ? { ...edit, value: v } : null)}
                      onSave={save}
                      onCancel={cancel}
                    />

                    {/* Buffer */}
                    <NumberChip
                      label="Buf"
                      value={f.paddingTime}
                      active={is(f.id, 'paddingTime')}
                      editValue={edit?.field === 'paddingTime' ? (edit.value as number) : f.paddingTime}
                      onStart={() => startEdit(f.id, 'paddingTime', f.paddingTime)}
                      onChange={(v) => setEdit(edit ? { ...edit, value: v } : null)}
                      onSave={save}
                      onCancel={cancel}
                    />

                    {/* Rest */}
                    <NumberChip
                      label="Rest"
                      value={f.restPeriod}
                      active={is(f.id, 'restPeriod')}
                      editValue={edit?.field === 'restPeriod' ? (edit.value as number) : f.restPeriod}
                      onStart={() => startEdit(f.id, 'restPeriod', f.restPeriod)}
                      onChange={(v) => setEdit(edit ? { ...edit, value: v } : null)}
                      onSave={save}
                      onCancel={cancel}
                    />

                    {/* Start time */}
                    {is(f.id, 'startingTime') ? (
                      <span className="inline-flex items-center gap-1 bg-slate-700 rounded-md px-1.5 py-0.5 ring-1 ring-blue-500/40">
                        <Clock className="h-3 w-3 text-blue-400" />
                        <input
                          type="time"
                          autoFocus
                          value={edit!.value as string}
                          onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                          className="w-20 h-5 px-1 text-xs bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={save} className="p-0.5 rounded hover:bg-green-500/20"><Check className="h-3 w-3 text-green-400" /></button>
                        <button onClick={cancel} className="p-0.5 rounded hover:bg-red-500/20"><X className="h-3 w-3 text-red-400" /></button>
                      </span>
                    ) : (
                      <button
                        onClick={() => startEdit(f.id, 'startingTime', f.startingTime || '08:00')}
                        className="group/c inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all
                          hover:bg-slate-700 text-slate-300 hover:text-white border border-transparent hover:border-slate-600"
                        style={{ backgroundColor: 'rgba(51,65,85,.45)' }}
                      >
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="font-mono tabular-nums">{f.startingTime || '08:00'}</span>
                        <Pencil className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover/c:opacity-100 transition-opacity" />
                      </button>
                    )}

                    {/* Total summary */}
                    <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                      = <span className="text-slate-400">{tot}</span>min
                    </span>

                    <span className="text-slate-700 text-xs">·</span>

                    {/* Matches */}
                    {is(f.id, 'matchCount') ? (
                      <span className="inline-flex items-center gap-1 bg-slate-700 rounded-md px-1.5 py-0.5 ring-1 ring-blue-500/40">
                        <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">#</span>
                        <NumInput
                          value={edit!.value as number}
                          onChange={(v) => setEdit({ ...edit!, value: v })}
                          onSave={save}
                          onCancel={cancel}
                        />
                      </span>
                    ) : (
                      <button
                        onClick={() => startEdit(f.id, 'matchCount', f.matchCount)}
                        className="group/c inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all
                          hover:bg-slate-700 text-slate-300 hover:text-white border border-transparent hover:border-slate-600"
                        style={{ backgroundColor: 'rgba(51,65,85,.45)' }}
                      >
                        <span className="font-mono tabular-nums">{f.matchCount}</span>
                        <span className="text-[10px] text-slate-500">max/day</span>
                        <Pencil className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover/c:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>

                  {/* ── Format ──────────────────────────────────────────────── */}
                  <div className="w-56 shrink-0 text-right">
                    {is(f.id, 'formatName') ? (
                      <div className="inline-flex items-center gap-1">
                        <Select
                          value={edit!.value as string}
                          onValueChange={(v) => {
                            setEdit(null);
                            mutation.mutate({ flightId: f.id, field: 'formatName', value: v });
                          }}
                        >
                          <SelectTrigger className="h-7 w-52 text-xs bg-slate-800 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {getFormatOptions(f.teamCount).length > 0 ? (
                              getFormatOptions(f.teamCount).map((o: { value: string; label: string }) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-slate-500">
                                No templates for {f.teamCount}-team flights
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <button onClick={cancel} className="p-0.5 rounded hover:bg-red-500/20"><X className="h-3 w-3 text-red-400" /></button>
                      </div>
                    ) : f.formatName === 'Not Configured' ? (
                      <button
                        onClick={() => startEdit(f.id, 'formatName', f.formatName)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                          border border-dashed border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Assign format
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(f.id, 'formatName', f.formatName)}
                        className="group/f inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                          text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 max-w-full"
                      >
                        <span className="truncate">{f.formatName}</span>
                        <Pencil className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/f:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
