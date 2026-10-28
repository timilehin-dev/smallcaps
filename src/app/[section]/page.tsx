import type { Metadata } from 'next'
import { SectionView } from '@/components/SectionView'
import { SECTIONS } from '@/lib/site'

export const revalidate = 60
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }))
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params
  const cfg = SECTIONS[section as keyof typeof SECTIONS]
  return cfg ? { title: cfg.title, description: cfg.blurb, alternates: { canonical: `/${section}` } } : {}
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return <SectionView section={section} page={1} />
}
