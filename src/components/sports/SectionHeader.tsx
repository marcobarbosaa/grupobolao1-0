export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="sports-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
