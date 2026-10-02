interface BrandingLoaderProps {
  clientName?: string
  label?: string
}

export default function BrandingLoader({
  clientName = 'Loading',
  label = 'Loading',
}: BrandingLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0D12] text-white"
      role="status"
      aria-live="polite"
      aria-label={`${clientName} ${label}`}
    >
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-white opacity-[0.035] blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-white opacity-[0.025] blur-3xl" />

      <div className="relative flex flex-col items-center">
        <div className="relative mb-8 h-24 w-24">
          <div
            className="absolute inset-0 rounded-full border border-white/10"
            style={{
              animation: 'branding-loader-pulse 2s ease-in-out infinite',
            }}
          />

          <div
            className="absolute inset-1 rounded-full border-2 border-transparent border-t-white/90 border-r-white/40"
            style={{
              animation: 'branding-loader-spin 1.4s linear infinite',
            }}
          />

          <div className="absolute inset-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />

            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/10" />

            <div className="absolute left-1/2 top-0 h-full w-1/4 -translate-x-1/2 border-x border-white/10" />

            <div
              className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.35)]"
              style={{
                animation:
                  'branding-loader-ball 1.2s ease-in-out infinite',
              }}
            >
              <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-[#0B0D12] opacity-40" />
              <span className="absolute right-1 top-1.5 h-1 w-1 rounded-full bg-[#0B0D12] opacity-40" />
              <span className="absolute bottom-1 left-1.5 h-1 w-1 rounded-full bg-[#0B0D12] opacity-40" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="mb-2 max-w-[80vw] truncate font-display text-lg font-bold tracking-[0.12em] text-white">
            {clientName}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-[0.24em] text-white/45">
            <span>{label}</span>

            <span className="flex gap-1">
              <span
                className="h-1 w-1 rounded-full bg-white/80"
                style={{
                  animation:
                    'branding-loader-dot 1.4s ease-in-out infinite',
                }}
              />

              <span
                className="h-1 w-1 rounded-full bg-white/80"
                style={{
                  animation:
                    'branding-loader-dot 1.4s ease-in-out 0.2s infinite',
                }}
              />

              <span
                className="h-1 w-1 rounded-full bg-white/80"
                style={{
                  animation:
                    'branding-loader-dot 1.4s ease-in-out 0.4s infinite',
                }}
              />
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes branding-loader-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes branding-loader-pulse {
          0%,
          100% {
            transform: scale(0.96);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.04);
            opacity: 0.75;
          }
        }

        @keyframes branding-loader-ball {
          0%,
          100% {
            transform: translate(-50%, -70%);
          }

          50% {
            transform: translate(-50%, 30%);
          }
        }

        @keyframes branding-loader-dot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }

          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}