import Image from 'next/image'

const features = [
  {
    img: '/images/landing/plan.jpg',
    title: 'Plan',
    description:
      'Create clear care plans with shared tasks, priorities, and gentle structure so nothing important is missed.',
  },
  {
    img: '/images/landing/connect.jpg',
    title: 'Connect',
    description:
      'Keep families, caregivers, and clinicians aligned through shared updates and meaningful moments.',
  },
  {
    img: '/images/landing/routine.jpg',
    title: 'Routine',
    description:
      'Build consistency with daily habits, medication tracking, and reminders that feel calm, not clinical.',
  },
  {
    img: '/images/landing/support.jpg',
    title: 'Support',
    description:
      'Coordinate care effortlessly in one shared space designed for clarity, compassion, and trust.',
  },
]

export default function Features() {
  return (
    <section className="relative w-full py-24 px-6 bg-[#FAF7F2] rounded-t-3xl overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center mb-16">
        <p className="uppercase tracking-[0.25em] text-[11px] text-[#8C6A43] font-medium">
          Gentle by design
        </p>

        <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-[#2A2118] max-w-2xl leading-tight">
          A calmer way to care for the people who matter most
        </h2>

        <p className="mt-4 text-[#6F6255] max-w-xl text-sm md:text-base">
          COCO brings clarity and emotional ease to caregiving, helping families
          stay connected, organized, and present in everyday moments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {features.map((feature, i) => (
          <div
            key={i}
            className="group relative w-full aspect-[4/3] sm:aspect-[3/4] overflow-hidden rounded-xl"
          >
            <Image
              src={feature.img}
              alt={feature.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
            {/* gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
              <h3 className="text-sm font-semibold tracking-wide text-white drop-shadow-sm">
                {feature.title}
              </h3>
              <p className="text-[12px] sm:text-[13px] text-white/90 leading-relaxed mt-1 max-w-[95%]">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* subtle ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#EADFD2] blur-[120px] opacity-30 pointer-events-none" />
    </section>
  )
}
