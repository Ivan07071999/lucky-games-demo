type StarIconProps = {
  className?: string;
};

export function StarIcon({ className = 'size-5' }: StarIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m12 2 2.35 7.65L22 12l-7.65 2.35L12 22l-2.35-7.65L2 12l7.65-2.35L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}
