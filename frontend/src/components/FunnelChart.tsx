/**
 * Lead Flow - Conversion Flow Graph
 * ==================================
 * SVG-based flow visualization showing lead progression through the pipeline.
 * Each stage is a node connected by flowing "rivers" that thin out to show drop-off.
 * Lost leads branch off as red streams.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  // Layout constants
  const nodeW = 160;
  const nodeH = 52;
  const gapY = 18;
  const totalH = data.length * nodeH + (data.length - 1) * gapY + 20;
  const centerX = 190;

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: totalH }}>
      <svg
        width="100%"
        height={totalH}
        viewBox={`0 0 380 ${totalH}`}
        className="overflow-visible"
      >
        <defs>
          {/* Animated flow gradient */}
          <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
          {/* Loss gradient */}
          <linearGradient id="lossGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Animated dash for flow lines */}
          <style>{`
            @keyframes flowDash {
              to { stroke-dashoffset: -20; }
            }
            .flow-line {
              animation: flowDash 1.5s linear infinite;
            }
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .node-enter {
              opacity: 0;
              animation: fadeSlideIn 0.5s ease forwards;
            }
          `}</style>
        </defs>

        {data.map((step, i) => {
          const y = i * (nodeH + gapY) + 10;
          const nextStep = data[i + 1];
          const isLast = i === data.length - 1;

          // River width proportional to value
          const riverW = Math.max(4, (step.value / maxVal) * 40);
          const nextRiverW = nextStep
            ? Math.max(4, (nextStep.value / maxVal) * 40)
            : riverW;

          // Drop rate
          const dropRate =
            i > 0 && data[i - 1].value > 0
              ? Math.round(
                  ((data[i - 1].value - step.value) / data[i - 1].value) * 100
                )
              : 0;

          const convRate = Math.round((step.value / data[0].value) * 100);
          const lostCount = i > 0 ? data[i - 1].value - step.value : 0;

          return (
            <g
              key={step.label}
              className="node-enter"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* ── Flow river from previous node ── */}
              {!isLast && (
                <g>
                  {/* Main flow path (curved trapezoid) */}
                  <path
                    d={`
                      M ${centerX - riverW / 2} ${y + nodeH}
                      C ${centerX - riverW / 2} ${y + nodeH + gapY * 0.6},
                        ${centerX - nextRiverW / 2} ${y + nodeH + gapY * 0.4},
                        ${centerX - nextRiverW / 2} ${y + nodeH + gapY}
                      L ${centerX + nextRiverW / 2} ${y + nodeH + gapY}
                      C ${centerX + nextRiverW / 2} ${y + nodeH + gapY * 0.4},
                        ${centerX + riverW / 2} ${y + nodeH + gapY * 0.6},
                        ${centerX + riverW / 2} ${y + nodeH}
                      Z
                    `}
                    fill={step.color}
                    opacity={visible ? 0.15 : 0}
                    style={{
                      transition: `opacity 0.8s ease ${i * 150}ms`,
                    }}
                  />
                  {/* Center flow pulse line */}
                  <line
                    x1={centerX}
                    y1={y + nodeH}
                    x2={centerX}
                    y2={y + nodeH + gapY}
                    stroke={step.color}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="flow-line"
                    opacity={visible ? 0.5 : 0}
                    style={{
                      transition: `opacity 0.6s ease ${i * 150}ms`,
                    }}
                  />

                  {/* ── Loss branch (red outflow) ── */}
                  {lostCount > 0 && nextStep && (
                    <g>
                      {/* Red curved branch going right */}
                      <path
                        d={`
                          M ${centerX + riverW / 2} ${y + nodeH + 4}
                          Q ${centerX + riverW / 2 + 50} ${y + nodeH + gapY / 2},
                            ${centerX + 90} ${y + nodeH + gapY / 2 + 2}
                        `}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={Math.max(1, (lostCount / maxVal) * 12)}
                        strokeLinecap="round"
                        opacity={visible ? 0.35 : 0}
                        style={{
                          transition: `opacity 0.8s ease ${i * 150 + 300}ms`,
                        }}
                      />
                      {/* Loss label */}
                      <g
                        opacity={visible ? 1 : 0}
                        style={{
                          transition: `opacity 0.5s ease ${i * 150 + 500}ms`,
                        }}
                      >
                        <rect
                          x={centerX + 92}
                          y={y + nodeH + gapY / 2 - 9}
                          width={56}
                          height={18}
                          rx={9}
                          fill="rgba(239,68,68,0.12)"
                          stroke="rgba(239,68,68,0.25)"
                          strokeWidth="0.5"
                        />
                        <text
                          x={centerX + 120}
                          y={y + nodeH + gapY / 2 + 4}
                          textAnchor="middle"
                          fill="#f87171"
                          fontSize="8"
                          fontWeight="900"
                        >
                          -{dropRate}% • {lostCount}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* ── Node ── */}
              <g>
                {/* Glow backdrop */}
                <rect
                  x={centerX - nodeW / 2 - 2}
                  y={y - 2}
                  width={nodeW + 4}
                  height={nodeH + 4}
                  rx={18}
                  fill={step.color}
                  opacity={visible ? 0.06 : 0}
                  filter="url(#glow)"
                  style={{
                    transition: `opacity 0.6s ease ${i * 120}ms`,
                  }}
                />
                {/* Main card */}
                <rect
                  x={centerX - nodeW / 2}
                  y={y}
                  width={nodeW}
                  height={nodeH}
                  rx={16}
                  fill="rgba(15,23,42,0.85)"
                  stroke={step.color}
                  strokeWidth="1"
                  strokeOpacity={visible ? 0.4 : 0}
                  style={{
                    transition: `stroke-opacity 0.5s ease ${i * 120}ms`,
                  }}
                />
                {/* Color accent bar */}
                <rect
                  x={centerX - nodeW / 2 + 10}
                  y={y + 14}
                  width={3}
                  height={24}
                  rx={1.5}
                  fill={step.color}
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.4s ease ${i * 120 + 100}ms`,
                  }}
                />
                {/* Label */}
                <text
                  x={centerX - nodeW / 2 + 20}
                  y={y + 22}
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.4s ease ${i * 120 + 200}ms`,
                    textTransform: "uppercase",
                  }}
                >
                  {step.label}
                </text>
                {/* Value */}
                <text
                  x={centerX - nodeW / 2 + 20}
                  y={y + 40}
                  fill="white"
                  fontSize="16"
                  fontWeight="900"
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.4s ease ${i * 120 + 250}ms`,
                  }}
                >
                  {step.value}
                </text>
                {/* Conversion badge */}
                <rect
                  x={centerX + nodeW / 2 - 45}
                  y={y + 16}
                  width={35}
                  height={20}
                  rx={10}
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.4s ease ${i * 120 + 300}ms`,
                  }}
                />
                <text
                  x={centerX + nodeW / 2 - 27}
                  y={y + 30}
                  textAnchor="middle"
                  fill={i === 0 ? "#3b82f6" : step.color}
                  fontSize="9"
                  fontWeight="900"
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.4s ease ${i * 120 + 300}ms`,
                  }}
                >
                  {convRate}%
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
