import { useId } from "react";
import { motion } from "framer-motion";
import { Building2, Briefcase, MapPin } from "lucide-react";
import type { BusinessDetails } from "@/lib/comprehensiveAnalysisApi";
import { revealFromLeft, scaleReveal } from "./BusinessAnalysisLayout";

/** Soft purple → violet → pink (minimal blue) */
const HERO = {
  baseFrom: "oklch(0.52 0.19 305)",
  baseVia: "oklch(0.5 0.2 318)",
  baseTo: "oklch(0.54 0.18 332)",
  meshA: "oklch(0.62 0.16 320 / 0.35)",
  meshB: "oklch(0.68 0.14 345 / 0.28)",
  meshC: "oklch(0.58 0.12 298 / 0.2)",
} as const;

function HeroBackground() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Layer 1 — soft diagonal base (violet-pink, not blue) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${HERO.baseFrom} 0%, ${HERO.baseVia} 48%, ${HERO.baseTo} 100%)`,
        }}
        animate={{ opacity: [0.14, 0.2, 0.14] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Layer 2 — mesh-style radial blooms */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 12% 18%, ${HERO.meshA}, transparent 55%),
            radial-gradient(ellipse 60% 50% at 88% 12%, ${HERO.meshB}, transparent 50%),
            radial-gradient(ellipse 55% 45% at 50% 100%, ${HERO.meshC}, transparent 52%)
          `,
        }}
        animate={{ opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Layer 3 — slow shifting wash (pink-violet) */}
      <motion.div
        className="absolute inset-0 bg-linear-to-tr from-[oklch(0.65_0.14_330/0.08)] via-transparent to-[oklch(0.7_0.12_310/0.08)]"
        animate={{ opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Radial spotlight — top-left intelligence glow */}
      <motion.div
        className="absolute -left-[10%] -top-[20%] h-[55%] w-[55%] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.1 320 / 0.22) 0%, transparent 68%)",
        }}
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.04, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Radial accent — bottom-right warmth */}
      <motion.div
        className="absolute -bottom-[15%] -right-[8%] h-[50%] w-[50%] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.15 345 / 0.2) 0%, transparent 65%)",
        }}
        animate={{ opacity: [0.35, 0.65, 0.35], x: [0, 8, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating ambient orbs */}
      <motion.div
        className="absolute right-[18%] top-[22%] h-32 w-32 rounded-full bg-white/[0.07] blur-2xl"
        animate={{ y: [0, -12, 0], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[28%] left-[8%] h-24 w-24 rounded-full bg-[oklch(0.7_0.12_330/0.15)] blur-2xl"
        animate={{ y: [0, 10, 0], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Subtle top edge highlight */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Soft light sweep */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)" }}
      >
        <motion.div
          className="absolute top-0 h-full w-[45%] -skew-x-12 bg-linear-to-r from-transparent via-white/7 to-transparent"
          animate={{ x: ["-80%", "220%"] }}
          transition={{ duration: 11, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Fine grain (very subtle) */}
      <motion.div
        className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}

function AmbientParticles() {
  const spots = [
    { left: "8%", top: "20%", size: 2, dur: 6 },
    { left: "72%", top: "14%", size: 3, dur: 7.5 },
    { left: "45%", top: "38%", size: 2, dur: 5.5 },
    { left: "88%", top: "55%", size: 2, dur: 8 },
    { left: "22%", top: "68%", size: 3, dur: 6.8 },
    { left: "58%", top: "78%", size: 2, dur: 7.2 },
  ];

  return (
    <>
      {spots.map((s, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-white/40 shadow-[0_0_8px_2px_rgba(255,255,255,0.15)]"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{
            y: [0, -10 - (i % 2) * 4, 0],
            opacity: [0.12, 0.45, 0.12],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: s.dur,
            repeat: Infinity,
            delay: i * 0.45,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function HealthScoreWidget({ score }: { score: number }) {
  const ringGrad = useId().replace(/:/g, "") + "-ring";
  const ringGlow = useId().replace(/:/g, "") + "-glow";
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;
  const scoreLabel =
    score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Fair" : "Needs work";

  return (
    <motion.div
      variants={scaleReveal as any}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.18 }}
      whileHover={{ y: -4 }}
      className="relative shrink-0"
    >
      {/* Outer pulse halo */}
      <motion.div
        aria-hidden
        className="absolute -inset-4 rounded-[1.75rem]"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.12 320 / 0.35) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pulsing glow behind entire widget */}
      <motion.div
        aria-hidden
        className="absolute -inset-5 rounded-[2rem]"
        style={{
          background: "radial-gradient(circle, oklch(0.68 0.18 310 / 0.3) 0%, transparent 65%)",
        }}
        animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.96, 1.05, 0.96] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="relative overflow-visible rounded-[1.4rem] border border-white/14 bg-white/2 px-5 pb-5 pt-6 shadow-none backdrop-blur-2xl md:px-6 md:pb-6 md:pt-7">
        {/* Glass layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-b from-white/14 via-white/4 to-transparent"
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[oklch(0.75_0.1_330/0.25)] blur-2xl"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          animate={{
            boxShadow: [
              "inset 0 0 0 1px rgba(255,255,255,0.14)",
              "inset 0 0 0 1px rgba(255,255,255,0.24), 0 0 28px -4px oklch(0.72 0.12 320 / 0.28)",
              "inset 0 0 0 1px rgba(255,255,255,0.14)",
            ],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex flex-col items-end gap-1">
          <div className="relative flex h-34 w-34 items-center justify-center self-end">
            <svg
              width="136"
              height="136"
              className="-rotate-90"
              style={{ filter: "drop-shadow(0 0 14px oklch(0.72 0.14 320 / 0.4))" }}
            >
              <defs>
                <linearGradient id={ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.97 0.02 305)" />
                  <stop offset="50%" stopColor="oklch(0.9 0.08 318)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.14 338)" />
                </linearGradient>
                <filter id={ringGlow} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="4.5"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={`url(#${ringGrad})`}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                filter={`url(#${ringGlow})`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-[2.2rem] font-semibold leading-none tabular-nums tracking-tight text-white">
                {score}
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Health
              </span>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mt-1.5 self-center text-center text-[11px] font-medium leading-snug text-white/90"
          >
            <span className="text-white">{scoreLabel}</span>
            <span className="mx-1.5 text-white/35">·</span>
            <span className="text-white/65">AI Score</span>
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export function BusinessHero({
  details,
  healthScore,
}: {
  details: BusinessDetails;
  healthScore?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="group/hero relative isolate overflow-hidden rounded-2xl border border-white/12 bg-transparent shadow-none backdrop-blur-xl"
    >
      <HeroBackground />
      <AmbientParticles />

      {/* Inset frame — premium edge */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.14]"
        animate={{ opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/12 to-transparent"
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10"
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-1 p-6 md:p-8 lg:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <motion.div
            variants={revealFromLeft as any}
            initial="hidden"
            animate="show"
            className="flex min-w-0 flex-1 items-start gap-3.5 md:gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.04, y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] backdrop-blur-md md:h-16 md:w-16"
            >
              <Building2 className="h-6 w-6 text-white/95 md:h-7 md:w-7" strokeWidth={1.75} />
            </motion.div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="wrap-break-word text-2xl font-semibold tracking-tight text-white md:text-3xl lg:text-[2rem]">
                {details.business_name}
              </h2>
              {details.summary && (
                <p className="mt-2.5 max-w-3xl text-[15px] leading-[1.7] text-white/92">
                  {details.summary}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/8 px-3.5 py-1.5 text-sm font-medium text-white/95 backdrop-blur-md">
                  <Briefcase className="h-3.5 w-3.5 text-white/75" strokeWidth={2} />
                  {details.business_type}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/8 px-3.5 py-1.5 text-sm font-medium text-white/95 backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 text-white/75" strokeWidth={2} />
                  {details.location}
                </span>
              </div>
            </div>
          </motion.div>

          {healthScore !== undefined && (
            <div className="mt-5 lg:mt-8">
              <HealthScoreWidget score={healthScore} />
            </div>
          )}
        </div>

        {details.services && details.services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 border-t border-white/10 pt-4"
          >
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Services offered
            </p>
            <div className="flex flex-wrap gap-2.5">
              {details.services.map((service, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 + idx * 0.04, duration: 0.4 }}
                  whileHover={{ y: -2 }}
                  className="rounded-lg border border-white/15 bg-white/6 px-2.5 py-1 text-sm font-medium text-white/92 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/10"
                >
                  {service}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
