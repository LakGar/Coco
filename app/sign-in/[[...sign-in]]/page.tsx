import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

export default function Page() {
  return( 
    <div className="min-h-screen min-w-screen bg-[#f6e9cf]/10 overflow-hidden p-4 relative flex items-center justify-center">
    <div className="fixed -top-8 -left-10 hidden md:block z-0 pointer-events-none">
        <Image src="/onboarding-left.png" alt="Coco" width={300} height={300} />
    </div>
    <div className="fixed -top-8 -left-10 block md:hidden z-0 pointer-events-none">
        <Image src="/onboarding-left.png" alt="Coco" width={200} height={200} />
    </div>
    <div className="fixed -bottom-10 right-0 hidden md:block z-0 pointer-events-none">
        <Image src="/onboarding-right.png" alt="Coco" width={300} height={300} />
    </div>
    <div className="fixed -bottom-10 right-0 block md:hidden z-0 pointer-events-none">
        <Image src="/onboarding-right.png" alt="Coco" width={200} height={200} />
    </div>
    <SignIn 
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/onboarding/check"
    />
  </div>
 
  )
}