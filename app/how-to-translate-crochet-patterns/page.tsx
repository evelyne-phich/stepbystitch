import { Metadata } from 'next';
import { HowToTranslateView } from '@/components/guide/how-to-translate-view';

export const metadata: Metadata = {
  title: 'How to Translate Crochet Patterns (US & UK Terms to French) | StepByStitch Guide',
  description: 'Learn how to easily convert and translate English crochet terms (US/UK) to French. Understand stitch charts, abbreviations, and automated conversion.',
  alternates: {
    canonical: '/how-to-translate-crochet-patterns',
    languages: {
      'en': '/how-to-translate-crochet-patterns',
      'fr': '/comment-traduire-patron-crochet',
    },
  },
};

export default function Page() {
  return <HowToTranslateView />;
}
