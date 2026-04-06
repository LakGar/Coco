import { ChevronLeft, ChevronRight, MoveLeftIcon } from 'lucide-react'

const AllFeatures = () => {
  return (
    <section
      id="features"
      className="relative w-full py-24 px-6 bg-primary overflow-hidden flex flex-col gap-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <h1 className="text-white text-xl md:text-2xl lg:text-3xl font-bold  md:w-[500px] lg:w-[600px]">
          At COCO, each day begins with gentle structure that helps families
          move through care with clarity.
        </h1>
        {/* <div className="flex items-center gap-2 md:justify-between lg:justify-start">
          <a className="tracking-[0.25em] text-sm font-medium text-white cursor-pointer hover:text-white/80 transition-all duration-300">
            All features
          </a>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center bg-white/10 rounded-full p-2 w-fit border border-white/10 cursor-pointer hover:bg-white/20 transition-all duration-300">
              <ChevronLeft className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center justify-center bg-white/10 rounded-full p-2 w-fit border border-white/10 cursor-pointer hover:bg-white/20 transition-all duration-300">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div> */}
      </div>
    </section>
  )
}

export default AllFeatures
