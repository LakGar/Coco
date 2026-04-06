import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Nav from '@/components/landing/nav'
import Footer from '@/components/landing/footer'
import BlogArticleLayout from '@/components/blog/blog-article-layout'
import { findPostBySlug } from '@/components/blog/posts'

type BlogPostPageProps = {
  params: {
    slug: string
  }
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = findPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Blog',
      description: 'Read the latest stories and guidance from Coco.',
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: [
        {
          url: post.coverImage,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}

const BlogPostPage = ({ params }: BlogPostPageProps) => {
  const post = findPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="w-screen flex flex-col justify-center items-center z-10 relative bg-primary-foreground overflow-x-hidden">
      <Nav />
      <main className="w-full">
        <BlogArticleLayout post={post}>
          {/* Example article content with inline images */}
          <p>
            Caring for someone you love rarely fits into tidy checklists. It
            happens in the quiet, in-between moments: when you are tying shoes,
            waiting for lab results, or reheating the same cup of coffee for the
            third time. Those are the places where presence matters most.
          </p>

          <p>
            At Coco, we think of routines not as rigid schedules, but as gentle
            patterns that make room for both your needs and theirs. When a
            morning feels rushed, the goal is not to add more tasks. It is to
            find one small anchor that slows the pace for everyone in the room.
          </p>

          <p>
            For Katie and her mom, that anchor became a simple breathing pause
            before breakfast. It started as an experiment: thirty seconds, hand
            over hand on the kitchen counter, counting slow inhales together.
          </p>

          {/* Inline image between paragraphs */}
          <figure className="my-8">
            <div className="relative w-full h-64 rounded-3xl overflow-hidden">
              <Image
                src="/images/landing/connect.jpg"
                alt="Caregiver holding hands in a quiet moment"
                fill
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-xs text-primary/60">
              A small pause at the counter can shift the tone of an entire
              morning.
            </figcaption>
          </figure>

          <p>
            Over time, this tiny ritual did more than ease the rush. It gave
            Katie a consistent moment to check in with her own body: Am I
            clenching my jaw? Am I already jumping three steps ahead? The same
            pause that soothed her mom also reminded her that she was still
            here, breathing too.
          </p>

          <p>
            You do not have to redesign your whole day to feel different in it.
            Start by choosing one transition—waking up, sitting down for
            medication, turning off the TV at night—and experiment with a
            60-second ritual. Light stretches, naming three things you are
            grateful for, a song you both love. The ritual is not about
            productivity. It is about saying, quietly but clearly: we are in
            this moment together.
          </p>

          {/* Another inline image further down */}
          <figure className="my-8">
            <div className="relative w-full h-64 rounded-3xl overflow-hidden">
              <Image
                src="/images/landing/support.jpg"
                alt="Family sitting together on a couch"
                fill
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-xs text-primary/60">
              Routines work best when they feel shared, not forced.
            </figcaption>
          </figure>

          <p>
            If you try this and it feels awkward at first, that is okay. New
            rituals almost always do. What matters is not perfection, but
            repetition—a signal your body and your loved one can learn to trust:
            here, in this tiny slice of the day, we move just a little more
            slowly.
          </p>
        </BlogArticleLayout>
      </main>
      <Footer />
    </div>
  )
}

export default BlogPostPage
