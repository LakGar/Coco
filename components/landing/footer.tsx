"use client";
import { FlickeringGrid, useMediaQuery, Icons } from "@/components/ui/flickering-footer";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    links: [
      { id: 1, title: "How it works", url: "/#demo" },
      { id: 2, title: "Pricing", url: "/pricing" },
      { id: 3, title: "FAQ", url: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { id: 4, title: "About", url: "/about" },
      { id: 5, title: "Team", url: "/team" },
      { id: 6, title: "Contact", url: "mailto:support@coco.app" },
    ],
  },
  {
    title: "Resources",
    links: [
      { id: 7, title: "Community", url: "/#waitlist" },
      { id: 8, title: "Support", url: "mailto:support@coco.app" },
    ],
  },
];

export default function Footer() {
  const tablet = useMediaQuery("(max-width: 1024px)");

  return (
    <footer id="footer" className="w-full pb-0 bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.png"
                alt="COCO Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-xl font-light text-primary font-serif tracking-wider">
              COCO
            </p>
          </Link>
          <p className="tracking-tight text-muted-foreground font-medium">
            When moments feel overwhelming, we help you find the patterns that bring peace. Caring for someone you love shouldn&apos;t mean carrying everything alone.
          </p>
          <div className="flex items-center gap-2 dark:hidden">
            <Icons.soc2 className="size-12" />
            <Icons.hipaa className="size-12" />
            <Icons.gdpr className="size-12" />
          </div>
          <div className="dark:flex items-center gap-2 hidden">
            <Icons.soc2Dark className="size-12" />
            <Icons.hipaaDark className="size-12" />
            <Icons.gdprDark className="size-12" />
          </div>
        </div>
        <div className="pt-5 md:w-1/2">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-center md:justify-between gap-y-5 lg:pl-10">
            {footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-sm font-semibold text-primary">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[15px]/snug text-muted-foreground"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-4 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-48 md:h-64 relative mt-24 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background z-10 from-40%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text={tablet ? "COCO" : "Care together"}
            fontSize={tablet ? 70 : 90}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#6B7280"
            maxOpacity={0.3}
            flickerChance={0.1}
          />
        </div>
      </div>
    </footer>
  );
}
