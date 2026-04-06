import Image from 'next/image'

export default function Mission() {
  return (
    <section className="w-full py-24 px-4 sm:px-6 bg-[#FAF7F2]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="uppercase tracking-[0.2em] text-[11px] text-[#8C6A43] font-medium mb-10">
          Gentle by design. Curious by nature.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[#2A2118] font-semibold text-xl sm:text-2xl md:text-3xl tracking-tight leading-tight">
          <h2 className="m-0">Our mission</h2>
          <div className="inline-flex shrink-0 w-[100px] ">
            <Image
              src="/images/about/mission-one.jpg"
              alt=""
              width={100}
              height={120}
              className="rounded-2xl object-cover w-full  max-h-[40px]"
            />
          </div>
          <h2 className="m-0">is</h2>
          <h2 className="m-0">simple</h2>
          <h2 className="m-0">to</h2>
          <h2 className="m-0">nurture</h2>
          <h2 className="m-0">children</h2>
          <h2 className="m-0">with</h2>
          <h2 className="m-0">care,</h2>
          <h2 className="m-0">not</h2>
          <h2 className="m-0">pressure.</h2>
          <h2 className="m-0">That&apos;s</h2>
          <h2 className="m-0">why</h2>
          <span className="inline-flex shrink-0 w-[100px] ">
            <Image
              src="/images/about/mission-two.jpg"
              alt=""
              width={180}
              height={120}
              className="rounded-2xl object-cover w-full  max-h-[40px]"
            />
          </span>
          <h2 className="m-0">our</h2>
          <h2 className="m-0">days</h2>
          <h2 className="m-0">are</h2>
          <h2 className="m-0">full</h2>

          <h2 className="m-0">of</h2>
          <h2 className="m-0">laughter,</h2>
          <h2 className="m-0">curiosity,</h2>
          <h2 className="m-0">and</h2>
          <h2 className="m-0">calm</h2>

          <h2 className="m-0">-</h2>
          <h2 className="m-0">not</h2>
          <h2 className="m-0">pressure.</h2>
        </div>
      </div>
    </section>
  )
}
