import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaChevronLeft, FaClock, FaEye, FaUser } from "react-icons/fa";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import { blogService } from "@/services/content";
import { formatDate, mediaUrl } from "@/lib/utils";

export default function BlogDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => blogService.post(slug),
  });

  if (isLoading) {
    return (
      <div className="container-app max-w-3xl space-y-4 py-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-app py-16 text-center text-gray-500">
        Post not found.{" "}
        <Link to="/blog" className="link">
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="container-app max-w-3xl py-6">
      <Seo
        title={post.title}
        description={post.excerpt}
        image={post.cover_image ? mediaUrl(post.cover_image) : undefined}
        type="article"
      />

      <button
        onClick={() => navigate("/blog")}
        className="btn-ghost mb-4 -ml-2"
      >
        <FaChevronLeft /> All posts
      </button>

      {post.category && (
        <Link
          to={`/blog?category__slug=${post.category.slug}`}
          className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
        >
          {post.category.name}
        </Link>
      )}

      <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{post.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {post.author_name && (
          <span className="flex items-center gap-1">
            <FaUser className="h-3 w-3" /> {post.author_name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <FaClock className="h-3 w-3" /> {post.read_minutes} min read
        </span>
        <span className="flex items-center gap-1">
          <FaEye className="h-3 w-3" /> {post.views} views
        </span>
        <span>{formatDate(post.published_at || post.created_at)}</span>
      </div>

      {post.cover_image && (
        <img
          src={mediaUrl(post.cover_image)}
          alt={post.title}
          className="mt-5 aspect-video w-full rounded-xl object-cover"
        />
      )}

      {post.excerpt && (
        <p className="mt-5 text-lg font-medium text-gray-600 dark:text-gray-300">
          {post.excerpt}
        </p>
      )}

      {/* Rich-text body from the admin editor */}
      <div
        className="prose prose-sm mt-5 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-brand-600"
        dangerouslySetInnerHTML={{ __html: post.content || "" }}
      />

      {post.tags_list?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags_list.map((t) => (
            <span
              key={t}
              className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-white">
        <h3 className="font-bold">Ready to ace your exams?</h3>
        <p className="mt-1 text-sm text-brand-100">
          Grab notes, PYQs and quantums for your branch and semester.
        </p>
        <Link to="/shop" className="btn-accent mt-3">
          Shop Study Material
        </Link>
      </div>
    </article>
  );
}
