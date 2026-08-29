import { ImageResponse } from 'next/og'
export const alt = 'Hear It — guess the song of the day'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function Bar({ left, height, opacity = 1 }: { left: number; height: number; opacity?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        bottom: 0,
        width: 18,
        height,
        borderRadius: 9,
        background: `rgba(200, 243, 90, ${opacity})`,
      }}
    />
  )
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#070807',
          color: '#f3f4ea',
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 18% 20%, rgba(200, 243, 90, 0.16), transparent 42%), radial-gradient(ellipse at 88% 90%, rgba(200, 243, 90, 0.08), transparent 40%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 72, position: 'relative' }}>
          <div style={{ display: 'flex', position: 'relative', width: 220, height: 72 }}>
            <Bar left={0} height={72} />
            <Bar left={26} height={58} opacity={0.82} />
            <Bar left={50} height={22} />
            <Bar left={74} height={32} />
            <Bar left={98} height={22} />
            <Bar left={122} height={58} opacity={0.82} />
            <Bar left={146} height={72} />
            <Bar left={190} height={72} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 28, letterSpacing: -1, color: '#c8f35a' }}>hear it</div>
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              fontSize: 64,
              fontWeight: 650,
              letterSpacing: -2.4,
              lineHeight: 1.02,
            }}
          >
            Guess the song.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontSize: 64,
              fontWeight: 650,
              letterSpacing: -2.4,
              lineHeight: 1.02,
              color: '#c8f35a',
            }}
          >
            A tiny clip.
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 24, color: '#8b9084', letterSpacing: -0.4 }}>
            Daily game. Free. The less you hear, the more you score.
          </div>
        </div>
      </div>
    ),
    size,
  )
}
