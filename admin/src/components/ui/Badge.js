const TONES = {
  neutral: "bg-surface-alt text-ink2",
  success: "bg-green-tint text-success",
  danger: "bg-red-tint text-danger",
  warning: "bg-amber-tint text-secondary",
  info: "bg-primary-tint text-primary",
  purple: "bg-purple-tint text-purple",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TONES[tone] || TONES.neutral}`}
    >
      {children}
    </span>
  );
}
