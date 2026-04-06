import Link from 'next/link'
import { Button } from '../ui/button'
import { Check } from 'lucide-react'
import { Badge } from '../ui/badge'
const tiers = [
  {
    name: 'Essential',
    description: 'For one caregiver and close family.',
    price: 'Free',
    period: 'forever',
    features: [
      '1 care circle',
      'Shared tasks & notes',
      'Basic reminders',
      'Up to 3 members',
    ],
    cta: 'Get started',
    href: '#hero',
    featured: false,
  },
  {
    name: 'Family',
    description: 'For families and regular caregivers.',
    price: '$12',
    period: '/month',
    features: [
      'Unlimited care circles',
      'Care plans & routines',
      'Medication tracking',
      'Up to 10 members',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: '#hero',
    featured: true,
  },
  {
    name: 'Care Team',
    description: 'For care teams and clinicians.',
    price: '$29',
    period: '/month',
    features: [
      'Everything in Family',
      'Unlimited members',
      'Clinician access',
      'Export & reports',
      'Dedicated support',
    ],
    cta: 'Contact sales',
    href: '#hero',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative w-full py-24 px-6 bg-[#FAF7F2] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <Badge className="uppercase tracking-[0.25em] text-[11px] text-[#8C6A43] font-medium bg-[#8C6A43]/10 border-0">
            Pricing
          </Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-[#2A2118] max-w-2xl leading-tight">
            Simple, transparent pricing for every care circle
          </h2>
          <p className="mt-4 text-[#6F6255] max-w-xl text-sm md:text-base">
            Start free. Upgrade when you need more support. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden ${
                tier.featured
                  ? 'border-primary/30 shadow-[0_8px_30px_rgba(56,29,4,0.08)] lg:scale-[1.02] lg:-mt-1 lg:mb-1'
                  : 'border-[#E9E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
              }`}
            >
              {tier.featured && (
                <div className="absolute top-0 left-0 right-0 py-1.5 bg-primary text-primary-foreground text-center text-[10px] font-medium uppercase tracking-wider">
                  Most popular
                </div>
              )}
              <div
                className={`flex flex-col flex-1 p-6 ${tier.featured ? 'pt-10' : ''}`}
              >
                <h3 className="text-lg font-semibold text-[#2A2118]">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-[#6F6255] font-secondary">
                  {tier.description}
                </p>
                <div className="mt-6 flex items-baseline gap-0.5">
                  <span className="text-3xl font-semibold text-[#2A2118]">
                    {tier.price}
                  </span>
                  <span className="text-sm text-[#6F6255] font-secondary">
                    {tier.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-[#2A2118]"
                    >
                      <Check className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`mt-8 w-full rounded-full font-medium ${'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#EADFD2] blur-[120px] opacity-30 pointer-events-none" />
    </section>
  )
}
