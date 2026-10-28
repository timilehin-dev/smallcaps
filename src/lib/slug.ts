export function slugify(title: string, date: Date): string {
  const base =
    title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/, '') || 'post'
  return `${base}-${date.toISOString().slice(0, 10)}`
}

export function withSuffix(slug: string): string {
  return `${slug}-${Math.random().toString(36).slice(2, 6).padEnd(4, '0')}`
}
