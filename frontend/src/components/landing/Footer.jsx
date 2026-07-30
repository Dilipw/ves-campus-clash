export default function Footer() {
  return (
    <footer className="border-t border-ink-line py-8 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="font-mono text-[11px] text-text-lo tracking-wide">
          © {new Date().getFullYear()} VES CAMPUS CLASH
        </p>
        <p className="font-mono text-[11px] text-text-lo tracking-wide">
          BUILT BY THE DIGITAL &amp; IT TEAM
        </p>
      </div>
    </footer>
  );
}
