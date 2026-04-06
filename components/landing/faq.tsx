'use client'

import { useState } from 'react'
import { Badge } from '../ui/badge'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What is Coco?',
    answer:
      'Coco is a care coordination platform for families navigating memory care. We help you plan, connect, and stay organized—so you can focus on what matters: being present with your loved one.',
  },
  {
    question: 'Who is Coco for?',
    answer:
      'Coco is for families and care teams supporting someone with dementia, Alzheimer’s, or other memory-related conditions. Whether you’re a family member, paid caregiver, or clinician, Coco keeps everyone aligned in one calm, shared space.',
  },
  {
    question: 'How does Coco help with care plans?',
    answer:
      'You can create care plans with clear tasks, routines, and priorities. Assign who does what, set gentle reminders, and see when things are done. Everything lives in one place so nothing important is missed.',
  },
  {
    question: 'Is my family’s information private and secure?',
    answer:
      'Yes. We take privacy and security seriously. Your data is encrypted and we follow strict practices so only the people you invite can see your care circle’s information.',
  },
  {
    question: 'When can I try Coco?',
    answer:
      'We’re launching our beta in March 2026. Sign up to get early access and be the first to try a calmer way to coordinate care.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="relative w-full py-24 px-6 bg-[#FAF7F2] overflow-hidden">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center mb-14">
        <Badge className="uppercase tracking-[0.25em] text-[11px] text-[#8C6A43] font-medium bg-[#8C6A43]/10 border-0">
          FAQ
        </Badge>
        <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#2A2118] max-w-2xl leading-tight">
          No stress. No surprises.
        </h2>
        <p className="mt-4 text-[#6F6255] max-w-xl text-sm md:text-base">
          Just clear answers for calm, confident mornings.
        </p>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div
              key={i}
              className="rounded-xl border border-[#E9E2D8] bg-white/70 backdrop-blur-sm overflow-hidden transition-colors hover:border-[#D4C4B0]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-[15px] font-semibold text-[#2A2118]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`shrink-0 w-5 h-5 text-[#8C6A43] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 pt-0 text-[14px] text-[#6F6255] leading-relaxed border-t border-[#E9E2D8]/80">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#EADFD2] blur-[120px] opacity-30 pointer-events-none" />
    </section>
  )
}
