import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

const BlogHero = () => {
  return (
    <section className="relative w-full h-screen pt-32 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/landing/philosophy.jpg"
          alt="Soft caregiving moment"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-primary-foreground via-primary-foreground/70 to-transparent" />
      </div>

      {/* Soft light blobs to match main site */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-[#FAE6b9]/50 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-start gap-4">
        <Badge className="bg-white/80 text-primary font-secondary uppercase tracking-[0.2em] text-[10px]">
          Coco Journal
        </Badge>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Stories, insights, and small moments of calm for caregivers.
        </h1>

        <p className="max-w-xl text-sm sm:text-base text-white leading-relaxed">
          Read reflections from families, practical guides from clinicians, and
          gentle reminders that you&apos;re not doing this alone.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white">
          <span className="font-secondary uppercase tracking-[0.18em]">
            Featured this week
          </span>
          <span className="h-1 w-1 rounded-full bg-white" />
          <span>
            Care routines, burnout, and finding small pauses in the day
          </span>
        </div>
      </div>
    </section>
  )
}

export default BlogHero
