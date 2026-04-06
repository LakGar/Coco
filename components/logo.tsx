
type LogoProps = {
  className?: string;
  size?: number;
};

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="112 112 288 288"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M128 256 C128 176 192 128 256 128 C320 128 384 176 384 256 C384 336 320 384 256 384 C192 384 128 336 128 256" />
        <path d="M192 256 C192 216 224 192 256 192 C288 192 320 216 320 256 C320 296 288 320 256 320" />
      </g>
    </svg>
  );
}
