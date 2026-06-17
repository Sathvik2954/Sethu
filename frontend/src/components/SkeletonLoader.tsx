'use client'

import React from 'react'

// Single skeleton line/block
function Bone({ w = '100%', h = 16, mb = 8, radius = 0 }: {
  w?: string | number; h?: number; mb?: number; radius?: number
}) {
  return (
    <div style={{
      width: w, height: h, marginBottom: mb, borderRadius: radius,
      background: 'linear-gradient(90deg, #E8DDD0 25%, #F2EDE6 50%, #E8DDD0 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.4s ease-in-out infinite',
    }} />
  )
}

// ── Exported skeleton variants ────────────────────────────────

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ border: '1.5px solid #E0D0B8', background: '#FDFAF5', padding: '16px', marginBottom: '8px' }}>
      <Bone w="60%" h={14} mb={10} />
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} w={i === lines - 1 ? '40%' : '100%'} h={11} mb={6} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ border: '1.5px solid #E0D0B8', background: '#FDFAF5', padding: '16px' }}>
          <Bone w="50%" h={11} mb={10} />
          <Bone w="40%" h={28} mb={8} />
          <Bone w="60%" h={10} mb={0} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ padding: '10px 14px', background: '#E8DDD0', border: '1px solid #E0D0B8' }}>
                <Bone w="80%" h={10} mb={0} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} style={{ background: r % 2 === 0 ? '#FDFAF5' : '#F2EDE6' }}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} style={{ padding: '10px 14px', border: '1px solid #E0D0B8' }}>
                  <Bone w={c === 0 ? '60%' : '80%'} h={10} mb={0} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonNotification({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ border: '1.5px solid #E0D0B8', background: '#FDFAF5', padding: '14px 16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Bone w={8} h={8} mb={0} radius={50} />
            <Bone w="50%" h={13} mb={0} />
          </div>
          <Bone w="100%" h={10} mb={5} />
          <Bone w="70%" h={10} mb={0} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', flexShrink: 0, background: '#E8DDD0', animation: 'skeletonShimmer 1.4s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #E8DDD0 25%, #F2EDE6 50%, #E8DDD0 75%)' }} />
        <div style={{ flex: 1 }}>
          <Bone w="40%" h={20} mb={8} />
          <Bone w="60%" h={12} mb={0} />
        </div>
      </div>
      {[1,2,3].map(i => (
        <div key={i} style={{ border: '1.5px solid #E0D0B8', background: '#FDFAF5', padding: '16px' }}>
          <Bone w="30%" h={11} mb={14} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[1,2].map(j => (
              <div key={j}>
                <Bone w="40%" h={9} mb={6} />
                <Bone w="100%" h={36} mb={0} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Inject shimmer keyframes once
export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  )
}