'use client'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { MoveRightIcon } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Field, FieldGroup } from '../ui/field'
const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // Force play in case autoplay is blocked (e.g. some browsers)
    const play = () => video.play().catch(() => {})
    play()
    video.addEventListener('loadeddata', play)
    return () => video.removeEventListener('loadeddata', play)
  }, [])

  return (
    <div id="hero">
      {/* Fixed background video that everything scrolls over */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black">
        <video
          ref={videoRef}
          src="/videos/landing/hero.mp4"
          autoPlay
          muted
          loop
          preload="auto"
          className="w-full h-full object-cover min-w-full min-h-full"
        />
      </div>

      {/* Foreground hero content in normal flow */}
      <section className="relative h-screen w-full flex justify-center items-end pb-10">
        <div className="absolute inset-0 bg-black/30" />

        {/* content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-2">
          {/* update */}
          <div className="flex justify-center items-center gap-2 md:gap-8 bg-black/20 rounded-full p-2 backdrop-blur-sm">
            <Badge
              variant="secondary"
              className="text-[8px] lg:text-xs lg:px-2 lg:py-2 font-secondary uppercase"
            >
              update
            </Badge>
            <p className="text-[9px] lg:text-xs text-secondary font-secondary uppercase pr-2">
              Launch Beta: March 2026 | 12:00 PM UTC
            </p>
          </div>
          {/* title */}
          <p className="text-4xl md:text-6xl lg:text-7xl font-bold text-center text-white w-[450px] lg:w-[600px]">
            Find peace in overwhelming moments.
          </p>
          {/* buttons */}
          <div className="flex justify-center items-center gap-2">
            <Dialog>
              <form>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer rounded-full px-4 border border-primary md:text-lg md:p-6 ">
                    Get Started <MoveRightIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Join the waitlist</DialogTitle>
                    <DialogDescription>
                      Join the waitlist to get the latest news and updates.
                    </DialogDescription>
                  </DialogHeader>
                  <Field>
                    <Label htmlFor="email-1">Email</Label>
                    <Input
                      id="email-1"
                      name="email"
                      placeholder="example@example.com"
                    />
                  </Field>

                  <DialogFooter>
                    <Button type="submit">Join the waitlist</Button>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
            <Dialog>
              <form>
                <DialogTrigger asChild>
                  <Button
                    className="cursor-pointer rounded-full px-4 py-2 md:text-lg md:p-6 md:py-5   bg-white/10 backdrop-blur-sm text-white border border-white"
                    variant="outline"
                  >
                    Subscribe
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Subscribe to our newsletter</DialogTitle>
                    <DialogDescription>
                      Subscribe to our newsletter to get the latest news and
                      updates.
                    </DialogDescription>
                  </DialogHeader>
                  <FieldGroup>
                    <Field>
                      <Label htmlFor="name-1">Name</Label>
                      <Input id="name-1" name="name" placeholder="John Doe" />
                    </Field>
                    <Field>
                      <Label htmlFor="username-1">Email</Label>
                      <Input
                        id="email-1"
                        name="email"
                        placeholder="example@example.com"
                      />
                    </Field>
                  </FieldGroup>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Subscribe</Button>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
          </div>
        </div>

        {/* instagram button */}
        <div className="hidden lg:block absolute bottom-5 right-5">
          <button
            onClick={() =>
              window.open('https://www.instagram.com/coco_caregiver/', '_blank')
            }
            className="rounded-2xl p-4  bg-white/10 backdrop-blur-sm text-white flex items-center gap-2 flex-col cursor-pointer hover:scale-105 transition-all duration-300"
          >
            <Image
              className="rounded-xl"
              src="https://img.freepik.com/free-vector/instagram-logo_1199-122.jpg?semt=ais_rp_progressive&w=740&q=80"
              alt="instagram"
              width={70}
              height={100}
            />
            <span className="text-white text-[10px] font-secondary uppercase">
              Follow Us
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}

export default Hero
