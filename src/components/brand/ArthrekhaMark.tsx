interface ArthrekhaMarkProps {
  size?: number;
  className?: string | undefined;
}

export default function ArthrekhaMark({ size = 24, className }: ArthrekhaMarkProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Arthrekha rupee mark">
      <path d="M6 7.5h19M6 12h16M18.5 12c-.6 5.5-4.5 8.4-9.6 8.4h1.7l10.2 5.1M23.5 24.5H29" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="24.5" r="1.25" fill="currentColor" />
    </svg>
  );
}
