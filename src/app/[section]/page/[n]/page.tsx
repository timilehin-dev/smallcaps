import type { Metadata } from 'next'
import { SectionView } from '@/components/SectionView'
import { SECTIONS } from '@/lib/site'

export const revalidate = 60

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ section: string; n: string }> }): Promise<Metadata> {
  const { section, n } = await params
  const cfg = SECTIONS[section as keyof typeof SECTIONS]
  return cfg ? { title: `${cfg.title} — page ${n}`, alternates: { canonical: `/${section}/page/${n}` } } : {}
}

export default async function SectionPageN({ params }: { params: Promise<{ section: string; n: string }> }) {
  const { section, n } = await params
  return <SectionView section={section} page={Number(n)} />
}
