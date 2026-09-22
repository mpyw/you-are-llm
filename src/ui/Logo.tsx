/**
 * A terminal prompt: a chevron and a cursor. It reads at 20 pixels in the
 * header and at 96 in the preview image, which a robot face would not.
 */
export function Logo({ size = 22 }: { readonly size?: number }) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="You are LLM"
    >
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.5" fill="#0b0e14" stroke="#242c38" />
      <path
        d="M9 10.5l5.5 5.5L9 21.5"
        fill="none"
        stroke="#3fb950"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="16.5" y="19" width="8.5" height="2.6" rx="1.3" fill="#58a6ff" />
    </svg>
  )
}
