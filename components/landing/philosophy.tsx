import Image from 'next/image'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
const Philosophy = () => {
  return (
        <div className='w-screen flex flex-col md:flex-row md:justify-center md:items-center  gap-4  z-10 relative bg-[#FAE6b9] p-4 py-20'>
            <div className=''>
        <Image src="/images/landing/philosophy.jpg" alt="Philosophy" width={300} height={300} className='w-[300px] md:w-[300px] lg:w-[500px] lg:h-[500px]  h-auto object-cover rounded-xl' />

            </div>
            <div className='flex flex-col gap-4'>
        <Badge variant="secondary" className='uppercase text-[10px] lg:text-xs bg-white'>Our Philosophy</Badge>
        <h1 className='text-2xl font-bold w-[350px] text-primary'>Caregiving deserves presence, not pressure.</h1>
        <p className='w-[350px] md:w-[400px] lg:w-[500px] text-primary/80'>At COCO, we believe support is not about doing more. It is about being there. We slow down the noise of daily responsibility to create space for connection, understanding, and calm moments of care.</p>
        <Button className='cursor-pointer rounded-full px-4 py-2 md:text-lg md:p-6 md:py-5  w-fit border border-white' variant="outline">Read Our Story</Button>
        </div>
        </div>
  )
}

export default Philosophy