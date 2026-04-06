import type { BlogPost } from './blog-card'

export const POSTS: BlogPost[] = [
  {
    id: 'slowing-down-the-morning-rush',
    slug: 'slowing-down-the-morning-rush',
    title: 'Slowing down the morning rush: one small ritual that changed our days',
    excerpt:
      'Between meds, breakfasts, and phone calls, our mornings felt like a sprint. This simple, three-minute ritual helped us reclaim a sense of presence before the chaos.',
    date: 'March 10, 2026',
    readTime: '6 min',
    category: 'Care routines',
    coverImage: '/images/landing/routine.jpg',
    author: {
      name: 'Katie Hill, RN',
      role: 'Family nurse & care coach at Coco',
      avatar: '/images/about/katie.png',
    },
  },
  {
    id: 'what-burnout-really-feels-like',
    slug: 'what-burnout-really-feels-like',
    title: 'What caregiver burnout really feels like (and how to notice it sooner)',
    excerpt:
      'Burnout rarely arrives all at once. It shows up in the small ways we dismiss our own needs. Here is how to spot the early signs and what to do next.',
    date: 'March 3, 2026',
    readTime: '8 min',
    category: 'Emotional health',
    coverImage: '/images/about/state.jpg',
    author: {
      name: 'Lakshay Garg',
      role: 'Co-founder & caregiver',
      avatar: '/images/about/lakshay.png',
    },
  },
  {
    id: 'sharing-the-load',
    slug: 'sharing-the-load',
    title: 'Sharing the load when you feel like you have to do everything yourself',
    excerpt:
      'Many caregivers carry the quiet belief that asking for help is failing. We explore scripts, small delegations, and ways to bring others into the circle of care.',
    date: 'February 24, 2026',
    readTime: '7 min',
    category: 'Family dynamics',
    coverImage: '/images/landing/support.jpg',
    author: {
      name: 'Coco Care Team',
      role: 'Clinical & lived-experience advisors',
      avatar: '/images/landing/philosophy.jpg',
    },
  },
  {
    id: 'when-a-good-day-goes-sideways',
    slug: 'when-a-good-day-goes-sideways',
    title: 'When a “good” day goes sideways: grounding in the middle of a spiral',
    excerpt:
      'Even on the days that start light, one phone call or symptom change can flip the script. Here are grounding practices you can reach for in the moment.',
    date: 'February 10, 2026',
    readTime: '5 min',
    category: 'In the moment',
    coverImage: '/images/landing/connect.jpg',
    author: {
      name: 'Community Voices',
      role: 'Stories from Coco families',
      avatar: '/images/landing/connect.jpg',
    },
  },
]

export const findPostBySlug = (slug: string) =>
  POSTS.find((post) => post.slug === slug)

