import Link from 'next/link'
import { Button } from '../ui/button'
import { Logo } from '@/components/logo'
import {
  FacebookIcon,
  InstagramIcon,
  MoveRightIcon,
  TwitterIcon,
  YoutubeIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../ui/dialog'
import { Field, FieldGroup } from '../ui/field'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

const Footer = () => {
  return (
    <div className="w-screen flex flex-col gap-4 justify-center items-center z-10 relative bg-primary-foreground p-4">
      <div className="w-full p-4 bg-[#FAE6b9] rounded-xl">
        <div className="w-full p-4 rounded-xl relative h-[500px] overflow-hidden flex flex-col gap-2">
          <video
            src="/videos/landing/footer.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-10 flex flex-col gap-2">
            <h1 className="text-white text-4xl font-bold drop-shadow-md w-[250px]">
              Ready to join the Family?
            </h1>
            <Button className="w-fit cursor-pointer rounded-full px-4 bg-white text-primary md:text-lg md:p-6 hover:bg-primary hover:text-white transition-all duration-300">
              Get Started <MoveRightIcon className="w-4 h-4" />
            </Button>
            <Button
              className="w-fit cursor-pointer rounded-full px-4 py-2 md:text-lg md:p-6 md:py-5 bg-white/10 backdrop-blur-sm text-white border border-white"
              variant="outline"
            >
              Subscribe
            </Button>
          </div>
        </div>
        {/* Links section — stacks on mobile, row on desktop */}
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-start gap-8 sm:gap-6 pt-4 border-t border-primary/10">
          <div>
            <p className="text-primary font-secondary font-light text-[10px] uppercase tracking-wider mb-3">
              Contact
            </p>

            <a
              href="tel:+14084558736"
              className="block text-primary text-sm font-light hover:underline"
            >
              +1 (408) 455-8736
            </a>
            <a
              href="mailto:staff@joincoco.app"
              className="block text-primary text-sm font-light mt-2 hover:underline"
            >
              staff@joincoco.app
            </a>
          </div>
          <div>
            <p className="text-primary font-secondary font-light text-[10px] uppercase tracking-wider mb-3">
              Product
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                href="/#features"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                Pricing
              </Link>
              <Link
                href="/#faq"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                FAQ
              </Link>
            </nav>
          </div>
          <div>
            <p className="text-primary font-secondary font-light text-[10px] uppercase tracking-wider mb-3">
              Company
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                About
              </Link>
              <Link
                href="/blog"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                Blog
              </Link>
              <Dialog>
                <form>
                  <DialogTrigger asChild>
                    <p className=" cursor-pointer text-primary text-sm font-semibold hover:underline w-fit">
                      Contact Us
                    </p>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Contact Us</DialogTitle>
                      <DialogDescription>
                        Contact us for any questions or feedback.
                      </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                      <div className="flex justify-between items-center gap-2">
                        <Field>
                          <Label htmlFor="name-1">First Name</Label>
                          <Input
                            id="firstName-1"
                            name="firstName"
                            placeholder="John"
                          />
                        </Field>
                        <Field>
                          <Label htmlFor="lastName-1">Last Name</Label>
                          <Input
                            id="lastName-1"
                            name="lastName"
                            placeholder="Doe"
                          />
                        </Field>
                      </div>

                      <Field>
                        <Label htmlFor="username-1">Email</Label>
                        <Input
                          id="email-1"
                          name="email"
                          placeholder="example@example.com"
                        />
                      </Field>
                      <Field>
                        <Label htmlFor="message-1">Message</Label>
                        <Textarea
                          id="message-1"
                          name="message"
                          placeholder="Your message"
                        />
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Submit</Button>
                    </DialogFooter>
                  </DialogContent>
                </form>
              </Dialog>
            </nav>
          </div>
          <div>
            <p className="text-primary font-secondary font-light text-[10px] uppercase tracking-wider mb-3">
              Legal
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                href="/privacy"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-primary text-sm font-semibold hover:underline w-fit"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-left md:items-center pt-4 gap-4 md:gap-0">
          <Link href="/" className="flex gap-2 shrink-0 flex-1">
            <Logo size={40} className="text-primary" />
            <span className="text-4xl font-bold text-primary">Coco</span>
          </Link>
          <div className="flex justify-left items-left md:items-center gap-2 min-w-[350px]">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50 hover:text-primary transition-all duration-300 cursor-pointer"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-6 h-6" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50 hover:text-primary transition-all duration-300 cursor-pointer"
              aria-label="Twitter"
            >
              <TwitterIcon className="w-6 h-6" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50 hover:text-primary transition-all duration-300 cursor-pointer"
              aria-label="Facebook"
            >
              <FacebookIcon className="w-6 h-6" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50 hover:text-primary transition-all duration-300 cursor-pointer"
              aria-label="YouTube"
            >
              <YoutubeIcon className="w-6 h-6" />
            </a>
          </div>
          <p className="flex justify-left items-left gap-2 text-xs text-primary/50">
            Built with ❤️ by{' '}
            <a
              href="https://theempowerweb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold"
            >
              TheEmpowerWeb
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Footer
