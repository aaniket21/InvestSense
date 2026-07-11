/**
 * VerdictBadge — verdict display with animated confidence ring.
 * Styled with the Stitch "Field Ledger" aesthetic:
 * muted, academic colors, clean typography.
 */

export default function VerdictBadge({ verdict }) {
  if (!verdict) return null;

  const { decision, confidence } = verdict;

  const colorMap = {
    Invest: { ring: '#2D6A4F', label: 'verdict-invest' },
    Pass: { ring: '#9B2C2C', label: 'verdict-pass' },
    Watch: { ring: '#B7791F', label: 'verdict-watch' },
  };

  const colors = colorMap[decision] || colorMap.Watch;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <div id="verdict-badge" className="flex flex-col items-center gap-5 animate-fade-in">
      {/* Confidence Ring */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#D4D9CC"
            strokeWidth="5"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={colors.ring}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl font-bold text-primary">{confidence}</span>
          <span className="label-caps">confidence</span>
        </div>
      </div>

      {/* Decision Badge */}
      <div className={`px-8 py-2.5 border-2 font-serif text-verdict-text font-semibold uppercase tracking-widest ${colors.label}`}>
        {decision}
      </div>
    </div>
  );
}
