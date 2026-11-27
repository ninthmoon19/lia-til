"use client";

// The Path tab's plan editor: rename, add, remove and reorder phases and their
// checklist items, then save the whole plan at once. Edits stay in a local draft
// until "Save plan", so a half-finished change never reaches the charts.

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { PLAN_LIMITS, TRACK_IDS, newPlanId, type PlanItem, type PlanPhase, type Track } from "@/lib/launchPath";
import { DEFAULT_PLAN, TRACKS } from "./data";
import { useT } from "./i18n";
import type { Status } from "./LaunchPath";

type DraftPhase = PlanPhase & { days: number };

const move = <T,>(list: T[], i: number, by: -1 | 1): T[] => {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

const same = (a: PlanPhase[], b: PlanPhase[]) => JSON.stringify(a) === JSON.stringify(b);

export function PlanEditor({ plan, days, done, onSave, onClose }: {
  plan: PlanPhase[]; days: number[]; done: Set<string>;
  onSave: (plan: PlanPhase[] | null, days: number[]) => Promise<Status>; onClose: () => void;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState<DraftPhase[]>(() => plan.map((p, i) => ({ ...p, days: days[i] ?? 14 })));
  const [status, setStatus] = useState<Status>({ text: "" });
  const [busy, setBusy] = useState(false);
  const isDefault = same(plan, DEFAULT_PLAN);

  const ids = () => draft.flatMap((p) => [p.id, ...p.items.map((i) => i.id)]);
  const setPhase = (pi: number, patch: Partial<DraftPhase>) =>
    setDraft((d) => d.map((p, i) => (i === pi ? { ...p, ...patch } : p)));
  const setItem = (pi: number, ii: number, patch: Partial<PlanItem>) =>
    setPhase(pi, { items: draft[pi].items.map((it, i) => (i === ii ? { ...it, ...patch } : it)) });

  const addPhase = () => {
    if (draft.length >= PLAN_LIMITS.phases) return setStatus({ text: "Up to {n} phases.", vars: { n: PLAN_LIMITS.phases }, err: true });
    setDraft((d) => [...d, { id: newPlanId("ph", ids()), name: "", tag: "", why: "", interview: false, items: [], days: 14 }]);
  };
  const addItem = (pi: number) => {
    if (draft[pi].items.length >= PLAN_LIMITS.items)
      return setStatus({ text: "Up to {n} items per phase.", vars: { n: PLAN_LIMITS.items }, err: true });
    setPhase(pi, { items: [...draft[pi].items, { id: newPlanId("it", ids()), track: "DSA", title: "", detail: "" }] });
  };
  const removePhase = (pi: number) => {
    if (draft.length <= 1) return setStatus({ text: "Keep at least one phase.", err: true });
    setDraft((d) => d.filter((_, i) => i !== pi));
  };

  const save = async () => {
    // Rows left completely empty are dropped; anything half-filled needs a name.
    const phases = draft.map((p) => ({ ...p, items: p.items.filter((i) => i.title.trim() || i.detail.trim()) }));
    if (phases.some((p) => !p.name.trim())) return setStatus({ text: "Every phase needs a name.", err: true });
    if (phases.some((p) => p.items.some((i) => !i.title.trim()))) return setStatus({ text: "Every item needs a task name.", err: true });
    if (phases.some((p) => !(Number.isInteger(p.days) && p.days >= 1 && p.days <= 90)))
      return setStatus({ text: "Each phase needs 1 to 90 days.", err: true });
    setBusy(true);
    setStatus({ text: "Saving…" });
    const plan = phases.map(({ id, name, tag, why, interview, items }) => ({ id, name, tag, why, interview, items }));
    const res = await onSave(plan, phases.map((p) => p.days));
    setBusy(false);
    if (res.err) setStatus(res);
    else onClose();
  };

  const restore = async () => {
    if (!window.confirm(t("Go back to the default plan? Your own phases and items will be replaced."))) return;
    setBusy(true);
    setStatus({ text: "Saving…" });
    const res = await onSave(null, DEFAULT_PLAN.map((_, i) => days[i] ?? 14));
    setBusy(false);
    if (res.err) setStatus(res);
    else onClose();
  };

  const st = status.text ? t(status.text, status.vars) : "";
  return (
    <div className="plan-edit">
      <p className="cap">
        {t("Change names, add or remove items, reorder with the arrows, then press Save plan. Nothing changes on the page until you save. Ticks stay with their items. Text you type shows as written in both languages.")}
      </p>

      {draft.map((p, pi) => (
        <fieldset key={p.id} className="phase pe-phase">
          <legend className="pe-legend">
            <span className="label">{t("Phase {n}", { n: pi + 1 })}</span>
            <span className="pe-tools">
              <IconBtn label={t("Move phase up")} onClick={() => setDraft((d) => move(d, pi, -1))} disabled={pi === 0}><ArrowUp /></IconBtn>
              <IconBtn label={t("Move phase down")} onClick={() => setDraft((d) => move(d, pi, 1))} disabled={pi === draft.length - 1}><ArrowDown /></IconBtn>
              <IconBtn label={t("Delete phase")} onClick={() => removePhase(pi)} danger><Trash2 /></IconBtn>
            </span>
          </legend>
          <div className="fields pe-fields">
            <label className="fld pe-wide">
              <span>{t("Name")}</span>
              <input value={p.name} maxLength={PLAN_LIMITS.name} onChange={(e) => setPhase(pi, { name: e.target.value })} placeholder={t("e.g. Graphs and DP")} />
            </label>
            <label className="fld">
              <span>{t("Tag")}</span>
              <input value={p.tag} maxLength={PLAN_LIMITS.tag} onChange={(e) => setPhase(pi, { tag: e.target.value })} placeholder={t("e.g. Hardest topics")} />
            </label>
            <label className="fld">
              <span>{t("Days")}</span>
              <input type="number" min={1} max={90} value={Number.isFinite(p.days) ? p.days : ""}
                onChange={(e) => setPhase(pi, { days: e.target.value === "" ? NaN : Number(e.target.value) })} />
            </label>
            <label className="fld pe-wide">
              <span>{t("Why this phase")}</span>
              <textarea rows={2} value={p.why} maxLength={PLAN_LIMITS.why} onChange={(e) => setPhase(pi, { why: e.target.value })} />
            </label>
            <label className="pe-check pe-wide">
              <input type="checkbox" checked={p.interview} onChange={(e) => setPhase(pi, { interview: e.target.checked })} />
              <span>{t("Interview mode: the daily schedule turns block 2 into a timed mock during this phase")}</span>
            </label>
          </div>

          <ul className="pe-items">
            {p.items.map((it, ii) => (
              <li key={it.id} className={done.has(it.id) ? "done" : ""}>
                <select value={it.track} aria-label={t("Track")} className={"tk " + it.track}
                  onChange={(e) => setItem(pi, ii, { track: e.target.value as Track })}>
                  {TRACK_IDS.map((id) => (
                    <option key={id} value={id}>{t(TRACKS.find((tr) => tr.id === id)!.name)}</option>
                  ))}
                </select>
                <input value={it.title} maxLength={PLAN_LIMITS.title} aria-label={t("Task")} placeholder={t("Task")}
                  onChange={(e) => setItem(pi, ii, { title: e.target.value })} />
                <input value={it.detail} maxLength={PLAN_LIMITS.detail} aria-label={t("Details")} placeholder={t("Details (optional)")}
                  onChange={(e) => setItem(pi, ii, { detail: e.target.value })} />
                <span className="pe-tools">
                  <IconBtn label={t("Move item up")} onClick={() => setPhase(pi, { items: move(p.items, ii, -1) })} disabled={ii === 0}><ArrowUp /></IconBtn>
                  <IconBtn label={t("Move item down")} onClick={() => setPhase(pi, { items: move(p.items, ii, 1) })} disabled={ii === p.items.length - 1}><ArrowDown /></IconBtn>
                  <IconBtn label={t("Delete item")} onClick={() => setPhase(pi, { items: p.items.filter((_, i) => i !== ii) })} danger><Trash2 /></IconBtn>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn ghost" onClick={() => addItem(pi)}>
            <Plus aria-hidden="true" className="ico" />{t("Add item")}
          </button>
        </fieldset>
      ))}

      <button type="button" className="btn ghost pe-add" onClick={addPhase}>
        <Plus aria-hidden="true" className="ico" />{t("Add phase")}
      </button>

      <div className="pe-bar">
        <button type="button" className="btn" onClick={save} disabled={busy}>
          <Save aria-hidden="true" className="ico" />{t("Save plan")}
        </button>
        <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
          <X aria-hidden="true" className="ico" />{t("Cancel")}
        </button>
        {!isDefault && (
          <button type="button" className="btn ghost" onClick={restore} disabled={busy}>
            <RotateCcw aria-hidden="true" className="ico" />{t("Restore default plan")}
          </button>
        )}
        {st && <span className={"status" + (status.err ? " err" : "")} role="status">{st}</span>}
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode;
}) {
  return (
    <button type="button" className={"icon-btn" + (danger ? " danger" : "")} aria-label={label} title={label}
      onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
