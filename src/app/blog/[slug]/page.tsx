import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPost } from "@/components/BlogPost";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE } from "@/content/copy";
import { adjacentPosts, getPost, listPosts } from "@/lib/blog";

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return post ? { title: `${post.title} · ${SITE.title}`, description: post.summary || undefined } : {};
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { newer, older } = adjacentPosts(slug, listPosts());
  return (
    <>
      <Header />
      <main className="wrap">
        <BlogPost post={post} newer={newer} older={older} />
      </main>
      <Footer />
    </>
  );
}
