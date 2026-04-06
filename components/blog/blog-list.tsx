import { BlogCard, type BlogPost } from './blog-card'

type BlogListProps = {
  posts: BlogPost[]
}

const BlogList = ({ posts }: BlogListProps) => {
  if (!posts.length) return null

  const [featured, ...rest] = posts

  return (
    <section className="relative w-full bg-primary-foreground px-4 py-20">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Featured + latest */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary">
              Latest writing from the Coco team
            </h2>
            <p className="text-xs sm:text-sm text-primary/60 font-secondary uppercase tracking-[0.16em]">
              New this month
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <BlogCard post={featured} variant="featured" />
            {rest[0] && <BlogCard post={rest[0]} />}
          </div>
        </div>

        {/* Remaining articles */}
        {rest.length > 1 && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg sm:text-xl font-semibold text-primary">
                More stories and guides
              </h3>
              <p className="text-xs sm:text-sm text-primary/60">
                Browse reflections, how-tos, and lived experience.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {rest.slice(1).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default BlogList
