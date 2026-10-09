import React from "react";
import { cn } from "../../utils/cn";

export function Skeleton({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/80",
        className
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return <PageSkeleton />;
}

export function CardGridSkeleton({ count = 6, columns = 3 }) {
  const colClass =
    columns === 4
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      : columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className={cn("grid gap-4", colClass)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-4 py-2 border-b border-slate-100">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4 py-3 border-b border-slate-50 last:border-0 items-center">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[75vh]">
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-2 pt-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <Skeleton className="h-6 w-32 bg-slate-800" />
            <Skeleton className="h-6 w-24 bg-slate-800" />
          </div>
          <div className="space-y-2 flex-1 pt-4">
            <Skeleton className="h-4 w-3/4 bg-slate-800" />
            <Skeleton className="h-4 w-1/2 bg-slate-800" />
            <Skeleton className="h-4 w-2/3 bg-slate-800" />
            <Skeleton className="h-4 w-4/5 bg-slate-800" />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <Skeleton className="h-9 w-24 bg-slate-800 rounded-xl" />
            <Skeleton className="h-9 w-32 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
