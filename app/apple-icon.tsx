import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070807',
          borderRadius: 36,
        }}
      >
        <div style={{ display: 'flex', position: 'relative', width: 118, height: 92 }}>
          {[
            { left: 0, h: 92, o: 1 },
            { left: 16, h: 76, o: 0.82 },
            { left: 31, h: 30, o: 1 },
            { left: 46, h: 42, o: 1 },
            { left: 61, h: 30, o: 1 },
            { left: 76, h: 76, o: 0.82 },
            { left: 91, h: 92, o: 1 },
            { left: 112, h: 92, o: 1 },
          ].map((bar) => (
            <div
              key={bar.left}
              style={{
                position: 'absolute',
                left: bar.left,
                bottom: 0,
                width: 10,
                height: bar.h,
                borderRadius: 5,
                background: `rgba(200, 243, 90, ${bar.o})`,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  )
}
