'use client'
import { PulseFitHero } from '@/components/ui/pulse-fit-hero'

export default function PulseFitHeroDemo() {
  return (
    <PulseFitHero
      title="Caregiving deserves presence, not pressure."
      subtitle="At COCO, we believe support is not about doing more. It is about being there. We slow down the noise of daily responsibility to create space for connection, understanding, and calm moments of care."
      primaryAction={{
        label: 'Get Started',
        onClick: () => console.log('Start training'),
      }}
      secondaryAction={{
        label: 'Learn More',
        onClick: () => console.log('Browse programs'),
      }}
      disclaimer="*No credit card required"
      socialProof={{
        avatars: [
          'https://i.pravatar.cc/150?img=1',
          'https://i.pravatar.cc/150?img=2',
          'https://i.pravatar.cc/150?img=3',
          'https://i.pravatar.cc/150?img=4',
        ],
        text: 'Trusted by families and care teams',
      }}
      programs={[
        {
          image:
            'https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg',
          category: 'Presence',
          title: 'Being Here',
        },
        {
          image:
            'https://images.pexels.com/photos/6919280/pexels-photo-6919280.jpeg',
          category: 'Connection',
          title: 'Close Together',
        },
        {
          image:
            'https://images.pexels.com/photos/5790706/pexels-photo-5790706.jpeg',
          category: 'Understanding',
          title: 'Deep Understanding',
        },
        {
          image:
            'https://images.pexels.com/photos/7243360/pexels-photo-7243360.jpeg',
          category: 'Calm Moments',
          title: 'Quiet Ease',
        },
        {
          image:
            'https://images.pexels.com/photos/6918479/pexels-photo-6918479.jpeg',
          category: 'Support',
          title: 'Steady Support',
        },
      ]}
    />
  )
}
