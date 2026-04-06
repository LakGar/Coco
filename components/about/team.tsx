import Image from 'next/image'
const Team = () => {
  const team = [
    {
      name: 'Katie ',
      role: 'Founder & CEO',
      image: '/images/about/katie.png',
      description:
        'Clinical research professional with six years in dementia research, inspired to create COCO through both personal caregiving and cognitive health work.',
      mainColor: '#d9a384',
      secondaryColor: '#ffe3c4',
    },
    {
      name: 'Lakshay ',
      role: 'Co-Founder & CTO',
      image: '/images/about/lakshay.png',
      description:
        'Full stack developer and AI builder focused on simplifying complex workflows, who helped create COCO to make caregiving more organized, connected, and supportive for families.',
      mainColor: '#90afc2',
      secondaryColor: '#d8e3f1',
    },
    {
      name: 'Atira ',
      role: 'UI/UX',
      image: '/images/about/atira.png',
      description:
        'A product designer specializing in empathetic, human-centered design. With over 4 years of experience building systems that feel intuitive and supportive at the moments that matter most.',
      mainColor: '#90afc2',
      secondaryColor: '#d8e3f1',
    },
    

  ]
  return (
    <div className="w-screen p-4 mx-auto py-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 w-full">
        <h1 className="text-2xl font-bold text-primary md:text-4xl lg:text-5xl w-[350px] md:w-[400px] lg:w-[500px]">
          Meet the team behind Coco
        </h1>
        <p className="text-primary/80 w-[350px] md:w-[400px] lg:w-[500px] text-sm md:text-base">
          We are a team of caregivers, developers, and designers who are
          passionate about creating a better way to care for the people who
          matter most.
        </p>
      </div>
      <div className="mt-10 md:mt-14 flex flex-col md:flex-row gap-6 md:gap-8">
        {team.map((member) => (
          <div
            key={member.name}
            className="flex flex-col lg:max-w-[300px] overflow-hidden rounded-2xl shadow-lg p-4"
            style={{ backgroundColor: member.secondaryColor }}
          >
            <div
              className="relative w-fullshrink-0 aspect-4/5 md:aspect-square flex justify-center items-center rounded-xl overflow-hidden "
              style={{ backgroundColor: member.mainColor }}
            >
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>
            <div className="flex flex-col justify-center pt-6 ">
              <p className="text-xs font-secondary uppercase tracking-wide opacity-80 text-center">
                {member.role}
              </p>
              <h2 className="mt-1 text-xl font-bold md:text-3xl text-primary text-center">
                {member.name}
              </h2>
              <p className="mt-3 text-primary/90 text-xs md:text-sm leading-relaxed">
                {member.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Team
