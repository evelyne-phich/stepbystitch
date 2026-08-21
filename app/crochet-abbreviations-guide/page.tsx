import { Metadata } from 'next';
import { AbbreviationsGuideView } from '@/components/guide/abbreviations-guide-view';

export const metadata: Metadata = {
  title: 'Crochet Abbreviations Chart: US, UK & French Terms Explained | Step by Stitch',
  description: 'Complete crochet stitch conversion chart: Single crochet vs Double crochet, US vs UK terminology, and French equivalents for all crochet makers.',
  alternates: {
    canonical: '/crochet-abbreviations-guide',
    languages: {
      'en': '/crochet-abbreviations-guide',
      'fr': '/guide-abbreviations-crochet',
    },
  },
};

export default function Page() {
  return <AbbreviationsGuideView />;
}
