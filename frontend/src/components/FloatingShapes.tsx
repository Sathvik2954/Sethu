type FloatingShapesProps = {
  sides?: 'both' | 'right'
}

// Decorative animated geometric shapes for hero sections.
// Place inside a `position: relative; overflow: hidden;` container.
export default function FloatingShapes({ sides = 'both' }: FloatingShapesProps) {
  return (
    <>
      {/* Right side - always shown */}
      <div style={{
        position: 'absolute', width: 22, height: 22,
        border: '1.5px solid #C8A878',
        top: 24, right: 60,
        animation: 'sethuFloat1 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 14, height: 14,
        border: '1.5px solid #D94F00',
        top: 120, right: 140,
        animation: 'sethuFloat2 5s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 30, height: 30,
        border: '1.5px solid #3D7A50',
        bottom: 30, right: 30,
        animation: 'sethuFloat1 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 10, height: 10,
        background: '#E8C87A',
        top: 60, right: 220,
        animation: 'sethuFloat2 3.5s ease-in-out infinite',
      }} />

      {/* Left side - only when sides="both" */}
      {sides === 'both' && (
        <>
          <div style={{
            position: 'absolute', width: 24, height: 24,
            border: '1.5px solid #3D7A50',
            top: 40, left: 50,
            animation: 'sethuFloat2 5.5s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 12, height: 12,
            border: '1.5px solid #D94F00',
            top: 160, left: 130,
            animation: 'sethuFloat1 4.5s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 28, height: 28,
            border: '1.5px solid #C8A878',
            bottom: 50, left: 40,
            animation: 'sethuFloat2 6.5s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 9, height: 9,
            background: '#E8C87A',
            top: 90, left: 200,
            animation: 'sethuFloat1 3.8s ease-in-out infinite',
          }} />
        </>
      )}
    </>
  )
}