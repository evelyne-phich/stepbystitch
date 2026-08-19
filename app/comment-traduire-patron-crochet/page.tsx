import { Metadata } from 'next';
import { HowToTranslateView } from '@/components/guide/how-to-translate-view';

export const metadata: Metadata = {
  title: 'Comment Traduire un Patron de Crochet Anglais (US/UK) en Français | Guide StepByStitch',
  description: 'Guide pratique pour traduire facilement vos modèles et abréviations de crochet anglais (US/UK) vers le français. Convertissez vos termes en 1 clic.',
  alternates: {
    canonical: '/comment-traduire-patron-crochet',
    languages: {
      'fr': '/comment-traduire-patron-crochet',
      'en': '/how-to-translate-crochet-patterns',
    },
  },
};

export default function Page() {
  return <HowToTranslateView />;
}
