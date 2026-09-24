import { Link } from 'react-router-dom'
import { useOrganization } from '../context/OrganizationContext'

export default function Home() {
  const { landingContent, branding } = useOrganization()

  if (!landingContent) {
    return null
  }

  const { hero_content, how_it_works, final_cta } = landingContent

  return (
    <main className="bg-paper text-ink">
      {/* HERO */}
      <section className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        {branding?.hero_image_url && (
          <img
            src={branding.hero_image_url}
            alt="Pickleball court"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        )}

        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center px-6 py-20 sm:px-8 lg:px-12">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-court" />

              <span className="text-xs font-semibold tracking-[0.2em]">
                {hero_content.eyebrow}
              </span>
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              {hero_content.title}
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              {hero_content.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/booking"
                className="btn-court inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold shadow-lg"
              >
                {hero_content.primary_cta}
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/find-booking"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {hero_content.secondary_cta}
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-court" />
                Easy online booking
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-court" />
                Flexible schedules
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-court" />
                Secure your slot
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 sm:flex">
          <span className="text-[10px] font-semibold tracking-[0.25em]">
            SCROLL TO EXPLORE
          </span>

          <span className="h-8 w-px bg-white/40" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-court">
              {how_it_works.label}
            </p>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {how_it_works.title}
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
              {how_it_works.description}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {how_it_works.steps.map((step) => (
              <div
                key={step.number}
                className="group rounded-2xl border border-line bg-paper p-7 transition hover:-translate-y-1 hover:border-court"
              >
                <span className="font-display text-5xl font-semibold text-court/30 transition group-hover:text-court">
                  {step.number}
                </span>

                <h3 className="mt-6 font-display text-xl font-semibold text-ink">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-line bg-paper">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-court/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-court/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:px-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-court">
            {final_cta.label}
          </p>

          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {final_cta.title}
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-muted sm:text-base">
            {final_cta.description}
          </p>

          <Link
            to="/booking"
            className="btn-court mt-9 inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold"
          >
            {final_cta.button}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
