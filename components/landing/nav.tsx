"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Logo } from "@/components/logo";
import { MenuIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Field, FieldGroup } from "../ui/field";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const Nav = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="fixed top-0 left-0 w-full z-50 p-4 mx-auto flex justify-center items-center">
      <div className="w-full max-w-4xl flex flex-col justify-between items-center bg-white rounded-xl p-2 px-3">
        <div className="w-full flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo size={30} className="text-black" />
            <span className="text-2xl font-bold text-black">Coco</span>
          </Link>
          {/* desktop nav */}
          <div className="hidden lg:flex justify-center items-center gap-10 font-medium text-[12px]">
            <Link
              href="/"
              className="text-black hover:text-black/80 transition-all duration-300 cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-black hover:text-black/80 transition-all duration-300 cursor-pointer"
            >
              About
            </Link>
            <Link
              href="/#features"
              className="text-black hover:text-black/80 transition-all duration-300 cursor-pointer"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-black hover:text-black/80 transition-all duration-300 cursor-pointer"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="text-black hover:text-black/80 transition-all duration-300 cursor-pointer"
            >
              Blog
            </Link>
          </div>
          {/* mobile nav */}
          <div className="flex justify-center items-center gap-2">
            <Link href="/sign-up">
              <Button variant="default">Sign Up</Button>
            </Link>
            {/* <Dialog>
              <form>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer rounded-md px-3 py-0 text-xs bg-[#381d04]">
                    Contact Us
                  </Button>
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
            </Dialog> */}

            <div className="lg:hidden">
              {isOpen ? (
                <Button
                  onClick={() => setIsOpen(false)}
                  className="cursor-pointer rounded-lg px-3 py-0 border bg-secondary text-xs hover:bg-secondary/80 transition-all duration-300"
                >
                  <XIcon className="text-black w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setIsOpen(true)}
                  className="cursor-pointer rounded-lg px-3 py-0 border bg-secondary text-xs hover:bg-secondary/80 transition-all duration-300"
                >
                  <MenuIcon className="text-black w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* mobile menu with smooth open/close */}
        <div
          className={`grid transition-all duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="w-full flex flex-col gap-2 py-6 font-semibold text-[22px] text-center">
              <Link
                href="/"
                className="text-black hover:text-black/80 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-black hover:text-black/80 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="/#features"
                className="text-black hover:text-black/80 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-black hover:text-black/80 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="text-black hover:text-black/80 transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
