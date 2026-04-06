import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  coverImage: string
  author: {
    name: string
    role?: string
    avatar: string
  }
}

type BlogCardProps = {
  post: BlogPost
  variant?: 'featured' | 'default'
}

export const BlogCard = ({ post, variant = 'default' }: BlogCardProps) => {
  const isFeatured = variant === 'featured'

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/5 border border-primary/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isFeatured ? 'md:col-span-2 lg:grid lg:grid-cols-2' : ''
      }`}
    >
      {/* Cover image */}
      <div className={isFeatured ? 'relative h-64 lg:h-full' : 'relative h-56'}>
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          priority={isFeatured}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute left-4 bottom-4 flex items-center gap-2">
          <Badge className="bg-white/90 text-primary font-secondary uppercase text-[10px] tracking-wider">
            {post.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-4 sm:p-6 lg:p-8 gap-4">
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-secondary uppercase tracking-[0.16em] text-primary/60">
            <span>{post.date}</span>
            <span className="h-1 w-1 rounded-full bg-primary/30" />
            <span>{post.readTime} read</span>
          </div>

          {/* Title + excerpt */}
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary leading-snug">
              {post.title}
            </h3>
            <p className="text-sm sm:text-base text-primary/70 leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>

            {isFeatured && (
              <div className="mt-3 flex gap-2">
                <div className="relative h-14 w-20 overflow-hidden rounded-xl">
                  <Image
                    src="/images/landing/routine.jpg"
                    alt="Care routine"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-14 w-20 overflow-hidden rounded-xl">
                  <Image
                    src="/images/landing/support.jpg"
                    alt="Care support"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-primary/10">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-full overflow-hidden border border-primary/10 bg-primary-foreground">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary">
                {post.author.name}
              </span>
              {post.author.role && (
                <span className="text-[11px] text-primary/60">
                  {post.author.role}
                </span>
              )}
            </div>
          </div>

          <span className="text-[11px] font-secondary uppercase tracking-[0.16em] text-primary/50">
            Read story
          </span>
        </div>
      </div>
    </article>
  )
}

