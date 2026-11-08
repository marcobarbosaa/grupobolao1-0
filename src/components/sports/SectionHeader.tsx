import { PageHeader } from "../site/PageHeader";

/** Compatibility entrypoint. New pages should use PageHeader and purposeful context. */
export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return <PageHeader title={title} description={description} />;
}
