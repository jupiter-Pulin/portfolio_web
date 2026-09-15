import type { Metadata } from "next";
import { BlogIndex } from "@/components/BlogIndex";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BLOG, SITE } from "@/content/copy";
import { listPosts } from "@/lib/blog";

export const metadata: Metadata = { title: `${BLOG.eyebrow} · ${SITE.title}` };

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="wrap">
        <BlogIndex posts={listPosts()} />
      </main>
      <Footer />
    </>
  );
}
