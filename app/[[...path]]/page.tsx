import { notFound } from 'next/navigation';
import { Page as MakeswiftPage } from '@makeswift/runtime/next';
import { getSiteVersion } from '@makeswift/runtime/next/server';
import { Makeswift } from '@makeswift/runtime/next';
import { registerComponents } from '../makeswift/register-components';
import { client } from '@/lib/makeswift/client';
import RiskMatrix from '@/components/RiskMatrix'; // Adjust the path if needed

// TypeScript type for dynamic routes
type ParsedUrlQuery = { path?: string[] };

// Fetch site data for static generation
export async function getStaticProps(context: { params: ParsedUrlQuery }) {
  const makeswift = new Makeswift(process.env.MAKESWIFT_SITE_API_KEY);
  registerComponents(makeswift.runtime);

  const path = '/' + (context.params?.path ?? []).join('/');
  const snapshot = await client.getPageSnapshot(path, {
    siteVersion: getSiteVersion(),
  });

  if (!snapshot) {
    return { notFound: true };
  }

  return {
    props: { snapshot },
    revalidate: 60, // Revalidate every 60 seconds (ISR)
  };
}

// Generate static paths for pre-rendering
export async function generateStaticParams() {
  const pages = await client.getPages();
  return pages.map((page: any) => ({
    path: page.path.split('/').filter((segment: string) => segment !== ''),
  }));
}

// Main page component
export default function Page({ snapshot }: { snapshot: any }) {
  if (!snapshot) return notFound();

  return (
    <div>
      <RiskMatrix /> {/* Display Risk Matrix */}
      <MakeswiftPage snapshot={snapshot} />
    </div>
  );
}
