import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkCase } from "@/components/WorkCase";
import { SITE } from "@/content/copy";
import { PROJECTS, projectById } from "@/content/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/work/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = projectById(id);
  return project ? { title: `${project.name} · ${SITE.title}` } : {};
}

export default async function WorkDetailPage({ params }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const project = projectById(id);
  if (!project) notFound();
  return <WorkCase project={project} />;
}
