import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { BlogPost } from './blog-card'

type BlogArticleLayoutProps = {
  post: BlogPost
  children: React.ReactNode
}

const BlogArticleLayout = ({ post, children }: BlogArticleLayoutProps) => {
  return (
    <article className="w-full bg-primary-foreground">
      {/* Hero with base image */}
      <section className="relative w-full overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 mix-blend-multiply" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary-foreground via-primary-foreground/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-xs text-white/80">
            <Badge className="bg-white/90 text-primary font-secondary uppercase tracking-[0.18em] text-[10px]">
              {post.category}
            </Badge>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-secondary uppercase tracking-[0.18em]">
              {post.date}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-secondary uppercase tracking-[0.18em]">
              {post.readTime} read
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <div className="relative h-9 w-9 rounded-full overflow-hidden border border-white/40 bg-primary-foreground">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {post.author.name}
              </span>
              {post.author.role && (
                <span className="text-xs text-white/80">{post.author.role}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Article body with inline images */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <div className="prose prose-neutral max-w-none prose-p:text-primary/80 prose-headings:text-primary prose-strong:text-primary">
          {children}
        </div>
      </section>
    </article>
  )
}

export default BlogArticleLayout

