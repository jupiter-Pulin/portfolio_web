import { notFound } from "next/navigation";
import { WorkPlaceholder } from "@/components/WorkPlaceholder";
import { PROJECTS, projectById } from "@/content/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default async function WorkDetailPage({ params }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const project = projectById(id);
  if (!project) notFound();
  return <WorkPlaceholder project={project.name} />;
}
