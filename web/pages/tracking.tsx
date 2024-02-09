import dynamic from 'next/dynamic';
import Head from 'next/head';
import { getTitleString } from '../utils/string';

const StatsPage = dynamic(
  () => import('../components/StatsPage'),
  { ssr: false }
);

export default function Stats() {
  return (
    <>
      <Head>
        <title>{getTitleString('Tracking')}</title>
      </Head>
      <StatsPage />
    </>
  );
}
