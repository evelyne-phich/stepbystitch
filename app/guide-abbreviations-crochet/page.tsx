import { Metadata } from 'next';
import { AbbreviationsGuideView } from '@/components/guide/abbreviations-guide-view';

export const metadata: Metadata = {
  title: 'Guide des Abréviations de Crochet : Tableau US, UK et Français | Step by Stitch',
  description: 'Tableau de correspondance complet des termes de crochet : Single Crochet, Double Crochet, Half Treble. Ne confondez plus les abréviations US, UK et Françaises.',
  alternates: {
    canonical: '/guide-abbreviations-crochet',
    languages: {
      'fr': '/guide-abbreviations-crochet',
      'en': '/crochet-abbreviations-guide',
    },
  },
};

export default function Page() {
  return <AbbreviationsGuideView />;
}
