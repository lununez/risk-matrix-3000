import { notFound } from 'next/navigation'

import { Page as MakeswiftPage } from '@makeswift/runtime/next'
import { getSiteVersion } from '@makeswift/runtime/next/server'
import { Makeswift } from '@makeswift/runtime/next';
import { registerComponents } from '../makeswift/register-components';

export async function getStaticProps(context) {
  const makeswift = new Makeswift(process.env.MAKESWIFT_SITE_API_KEY);
  registerComponents(makeswift.runtime);
  
  // ... rest of your getStaticProps logic
}

// ... rest of your page component

import { client } from '@/lib/makeswift/client'
import RiskMatrix from '/components/RiskMatrix';
type ParsedUrlQuery = { path?: string[] }

export async function generateStaticParams() {
  return await client
    .getPages()
    .map(page => ({
      path: page.path.split('/').filter(segment => segment !== ''),
    }))
    .toArray()
}

export default async function Page({ params }: { params: ParsedUrlQuery }) {
  const path = '/' + (params?.path ?? []).join('/')
  const snapshot = await client.getPageSnapshot(path, {
    siteVersion: getSiteVersion(),
  })

  if (snapshot == null) return notFound()

  return <MakeswiftPage snapshot={snapshot} />
}
