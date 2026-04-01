"use client";

import Link from "next/link";

import { useAppState } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";
import { RELATION_TYPE_LABELS } from "@/lib/constants";
import type { RelatedWordModel, WordCardModel } from "@/types/view-models";
import type { RelationTypeValue } from "@/types";

type SemanticMapProps = {
  centerWord: WordCardModel;
  relatedWords: RelatedWordModel[];
  framed?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Relation type color palette                                       */
/* ------------------------------------------------------------------ */

const RELATION_COLORS: Record<RelationTypeValue, { line: string; dot: string; bg: string; text: string }> = {
  synonym:        { line: "#4f7b5b", dot: "bg-moss-500",  bg: "bg-moss-50",  text: "text-moss-700" },
  antonym:        { line: "#c4702e", dot: "bg-clay-500",  bg: "bg-clay-50",  text: "text-clay-500" },
  broader:        { line: "#4e88a2", dot: "bg-lake-500",  bg: "bg-lake-50",  text: "text-lake-500" },
  narrower:       { line: "#7c6fb0", dot: "bg-purple-400", bg: "bg-purple-50", text: "text-purple-600" },
  associated:     { line: "#6b8e7b", dot: "bg-moss-500/60", bg: "bg-moss-50", text: "text-moss-700" },
  categoryMember: { line: "#8a9ea8", dot: "bg-slate-400", bg: "bg-slate-50",  text: "text-slate-600" },
  variant:        { line: "#d58d4f", dot: "bg-clay-400",  bg: "bg-clay-50",  text: "text-clay-500" },
  similar:        { line: "#5a9aaf", dot: "bg-lake-500/70", bg: "bg-lake-50", text: "text-lake-500" },
};

/* ------------------------------------------------------------------ */
/*  Layout helpers                                                    */
/* ------------------------------------------------------------------ */

function getNodePositions(count: number) {
  const cx = 50;
  const cy = 50;
  // Alternate between two radii to stagger nodes and reduce overlap
  const innerR = 33;
  const outerR = 40;

  return Array.from({ length: count }, (_, i) => {
    const angle = ((Math.PI * 2) / Math.max(count, 1)) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  // Quadratic bezier curving slightly away from center
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // Push control point slightly perpendicular to the midpoint
  const dx = x2 - x1;
  const dy = y2 - y1;
  const offset = 3;
  const cx = mx + (dy / Math.sqrt(dx * dx + dy * dy || 1)) * offset;
  const cy = my - (dx / Math.sqrt(dx * dx + dy * dy || 1)) * offset;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SemanticMap({ centerWord, relatedWords, framed = true }: SemanticMapProps) {
  const { preferences } = useAppState();
  const nodes = relatedWords.slice(0, 8);
  const positions = getNodePositions(nodes.length);

  // Collect unique relation types used in this map
  const usedTypes = Array.from(new Set(nodes.map((n) => n.relationType)));

  return (
    <div className={cn(framed ? "surface-card p-4" : "space-y-4")}>
      {/* Map container */}
      <div className="relative aspect-square overflow-hidden rounded-4xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50">
        {/* Connection lines */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          {nodes.map((node, i) => {
            const pos = positions[i];
            const color = RELATION_COLORS[node.relationType];
            return (
              <path
                key={node.id}
                d={curvedPath(50, 50, pos.x, pos.y)}
                stroke={color.line}
                strokeWidth="0.5"
                strokeOpacity="0.5"
                fill="none"
                strokeDasharray={node.relationType === "similar" || node.relationType === "variant" ? "1.5 1" : "none"}
              />
            );
          })}
        </svg>

        {/* Center word */}
        <div className="absolute left-1/2 top-1/2 z-20 w-32 -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-2xl bg-moss-700 px-3 py-3 text-center text-white shadow-card">
            <p className="truncate text-base font-semibold leading-tight">{centerWord.lemma}</p>
            {preferences.showSyllabics && centerWord.syllabics ? (
              <p className="mt-0.5 truncate text-xs text-white/70">{centerWord.syllabics}</p>
            ) : null}
            <p className="mt-1 line-clamp-2 text-[0.68rem] leading-snug text-white/80">
              {centerWord.plainEnglish}
            </p>
          </div>
        </div>

        {/* Related word nodes */}
        {nodes.map((node, i) => {
          const pos = positions[i];
          const color = RELATION_COLORS[node.relationType];

          return (
            <Link
              key={node.id}
              href={`/word/${node.word.slug}`}
              className="absolute z-30 w-[5.5rem] -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="rounded-2xl border border-slate-200/90 bg-white px-2.5 py-2 text-center shadow-sm">
                {/* Relation type dot */}
                <div className="mb-1 flex items-center justify-center gap-1">
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color.dot)} />
                  <span className={cn("text-[0.55rem] font-medium uppercase tracking-wider", color.text)}>
                    {node.relationType === "categoryMember" ? "category" : node.relationType}
                  </span>
                </div>
                <p className="truncate text-xs font-semibold text-slate-900">{node.word.lemma}</p>
                <p className="mt-0.5 line-clamp-2 text-[0.6rem] leading-snug text-slate-500">
                  {node.word.plainEnglish}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      {usedTypes.length > 0 ? (
        <div className={cn(framed ? "mt-4" : "")}>
          <p className="section-label mb-2">Connection types</p>
          <div className="flex flex-wrap gap-2">
            {usedTypes.map((type) => {
              const color = RELATION_COLORS[type];
              const count = nodes.filter((n) => n.relationType === type).length;
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2.5 py-1"
                >
                  <span className={cn("inline-block h-2 w-2 rounded-full", color.dot)} />
                  <span className="text-xs font-medium text-slate-700">
                    {RELATION_TYPE_LABELS[type]}
                  </span>
                  {count > 1 ? (
                    <span className="text-[0.65rem] text-slate-400">{count}</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
