type LegalPageLayoutProps = {
  title: string
  description?: string
  children: React.ReactNode
}

const LegalPageLayout = ({ title, description, children }: LegalPageLayoutProps) => {
  return (
    <>
      <section className="relative w-full pt-28 pb-12 sm:pt-32 sm:pb-16 border-b border-primary/10 bg-[#FAE6b9]/20">
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-primary/80 text-sm sm:text-base max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="prose prose-neutral max-w-none prose-p:text-primary/80 prose-headings:text-primary prose-headings:font-bold prose-strong:text-primary prose-li:text-primary/80 prose-a:text-primary underline">
          {children}
        </div>
      </section>
    </>
  )
}

export default LegalPageLayout
