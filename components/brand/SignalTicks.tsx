type SignalTicksProps = {
  size?: number;
  className?: string;
  title?: string;
};

/** Equal-height proof ticks crossing a strata rule — not chart bars. */
const SignalTicks = ({
  size = 28,
  className,
  title = "Signal Ticks",
}: SignalTicksProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    <rect x="1.5" y="15" width="29" height="2" fill="#1B2430" />
    <rect x="5.75" y="10.5" width="2" height="11" fill="#1B2430" />
    <rect x="24.25" y="10.5" width="2" height="11" fill="#1B2430" />
    <rect x="13.25" y="10.5" width="2" height="11" fill="#2F6F8F" />
    <rect x="16.75" y="10.5" width="2" height="11" fill="#2F6F8F" />
  </svg>
);

export default SignalTicks;
