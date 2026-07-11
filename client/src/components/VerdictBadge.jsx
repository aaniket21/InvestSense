/**
 * VerdictBadge — large verdict display with animated confidence ring.
 * Per PRD §5: verdict badge (Invest/Pass/Watch) + confidence meter.
 */

export default function VerdictBadge({ verdict }) {
  if (!verdict) return null;

  const { decision, confidence } = verdict;

  const colorMap = {
    Invest: { ring: '#10b981', bg: 'verdict-invest', glow: 'shadow-invest/20' },
    Pass: { ring: '#ef4444', bg: 'verdict-pass', glow: 'shadow-pass/20' },
    Watch: { ring: '#f59e0b', bg: 'verdict-watch', glow: 'shadow-watch/20' },
  };

  const colors = colorMap[decision] || colorMap.Watch;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <div id="verdict-badge" className="flex flex-col items-center gap-4 animate-fade-in">
      {/* Confidence Ring */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-surface-700"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={colors.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{confidence}</span>
          <span className="text-xs text-gray-400 uppercase tracking-wider">confidence</span>
        </div>
      </div>

      {/* Decision Badge */}
      <div className={`px-8 py-2.5 rounded-full border-2 text-lg font-bold uppercase tracking-widest ${colors.bg} ${colors.glow} shadow-lg`}>
        {decision}
      </div>
    </div>
  );
}
