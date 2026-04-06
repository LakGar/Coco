import Image from 'next/image'
import React from 'react'

const State = () => {
  return (
    <div className="w-full bg-primary px-4 py-22">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl w-[350px] md:w-[400px] lg:w-[500px]">
          We don’t measure care by checklists
        </h1>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div>
            <Image
              src="/images/about/state.jpg"
              alt="State"
              width={700}
              height={700}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-4 w-full md:w-1/2">
            <p className="text-white text-md md:text-base  ">
              At COCO, we believe caregiving is not a race to do more — it is a
              rhythm to move through with intention and compassion.
            </p>
            <p className="text-white text-md  ">
              We see this season of life as a time to build steadiness, not just
              manage responsibilities. A time for shared stories, quiet
              reassurance, small victories, and moments of connection that bring
              comfort to both caregiver and loved one.
            </p>
            <p className="text-white text-md  pt-10 ">
              Here, support is not a system you must navigate alone — it is a
              space designed to hold you.
            </p>
            <p className="text-white text-md mb-40 ">
              Each day, COCO helps families move through gentle patterns of
              planning, connection, routine, and support. We nurture clarity,
              emotional understanding, and confidence through shared updates,
              thoughtful coordination, and tools that make everyday care feel
              calmer and more human.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default State
