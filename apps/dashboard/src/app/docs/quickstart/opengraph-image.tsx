import { ImageResponse } from 'next/og';

export const alt = 'OpenFacilitator quickstart';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const codeLines = [
  { text: 'npm install @openfacilitator/sdk', color: '#dbeafe' },
  { text: '', color: '#8b949e' },
  { text: 'const facilitator = new OpenFacilitator();', color: '#e6edf3' },
  { text: '// defaults to pay.openfacilitator.io', color: '#7ee787' },
  { text: '', color: '#8b949e' },
  { text: 'await facilitator.verify(', color: '#ffdf5d' },
  { text: 'payment,', color: '#ffdf5d', indent: 24 },
  { text: 'requirements', color: '#ffdf5d', indent: 24 },
  { text: ');', color: '#ffdf5d' },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Inter, Arial, sans-serif',
          padding: 54,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: '#0b64f4',
                color: 'white',
                fontSize: 21,
                fontWeight: 900,
              }}
            >
              OF
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>OpenFacilitator</div>
              <div style={{ fontSize: 18, color: '#64748b', marginTop: 2 }}>
                Free open source x402 facilitator
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '12px 16px',
              backgroundColor: 'white',
              color: '#0b64f4',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            /docs/quickstart
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 44,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', width: 550 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                padding: '9px 12px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              Quickstart
            </div>

            <div
              style={{
                marginTop: 20,
                fontSize: 70,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              x402 payments in minutes
            </div>

            <div
              style={{
                marginTop: 24,
                color: '#475569',
                fontSize: 28,
                lineHeight: 1.35,
                fontWeight: 500,
              }}
            >
              Use pay.openfacilitator.io with no account, no API key, and no rate limits.
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
              {['Base', 'Solana', 'Stacks'].map((network) => (
                <div
                  key={network}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #dbe3ee',
                    borderRadius: 8,
                    backgroundColor: 'white',
                    padding: '10px 14px',
                    color: '#334155',
                    fontSize: 19,
                    fontWeight: 700,
                  }}
                >
                  {network}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 510,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #1f2937',
              borderRadius: 8,
              backgroundColor: '#0d1117',
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
            }}
          >
            <div
              style={{
                height: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #30363d',
                padding: '0 18px',
                backgroundColor: '#161b22',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 8, backgroundColor: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: 8, backgroundColor: '#ffbd2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: 8, backgroundColor: '#28c840' }} />
              </div>
              <div style={{ color: '#8b949e', fontSize: 15, fontWeight: 700 }}>quickstart.ts</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '22px 24px 24px',
                fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
                fontSize: 21,
                lineHeight: 1.58,
              }}
            >
              {codeLines.map((line, index) => (
                <div
                  key={`${line.text}-${index}`}
                  style={{
                    display: 'flex',
                    color: line.color,
                    marginLeft: 'indent' in line ? line.indent : 0,
                  }}
                >
                  {line.text || ' '}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#64748b',
            fontSize: 19,
            fontWeight: 700,
          }}
        >
          <div>Open source. Public endpoint. Self-host when you need full control.</div>
          <div style={{ color: '#0b64f4' }}>openfacilitator.io</div>
        </div>
      </div>
    ),
    size
  );
}
