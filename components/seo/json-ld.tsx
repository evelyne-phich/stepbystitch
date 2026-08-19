export function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://stepbystitch.app/#software",
        "name": "StepByStitch",
        "url": "https://stepbystitch.app",
        "description": "Bibliothèque personnelle et lecteur intelligent de patrons de crochet. Transforme vos PDF et captures d'écran en checklists interactives, éditables, annotables et traduisibles à la demande.",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "All (Web, iOS, Android, macOS, Windows)",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        },
        "featureList": [
          "Import et stockage sécurisé de patrons PDF et captures d'écran",
          "Découpage automatique en checklist interactive étape par étape",
          "Traduction spécialisée crochet (termes US, UK, FR)",
          "Annotations et notes personnelles par rang",
          "Visualiseur intégré du fichier original côte-à-côte"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://stepbystitch.app/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Comment transformer un patron crochet PDF en checklist interactive ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Il vous suffit d'importer votre fichier PDF ou vos captures d'écran sur StepByStitch. L'intelligence artificielle extrait le texte, identifie le matériel, les tours et les rangs, et génère une liste d'étapes que vous pouvez cocher, corriger et annoter à votre rythme."
            }
          },
          {
            "@type": "Question",
            "name": "StepByStitch peut-il traduire un patron de crochet en anglais (US ou UK) vers le français ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui, absolument ! StepByStitch intègre un moteur de traduction spécialisé dans le vocabulaire technique du crochet. Il convertit avec précision les abréviations (comme sc, dc, hdc, inc, dec) en termes français correspondants (ms, br, db, aug, dim) sans altérer le nombre de mailles."
            }
          },
          {
            "@type": "Question",
            "name": "Mes patrons importés restent-ils privés et sécurisés ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui à 100%. Vos fichiers PDF et images sont stockés dans un espace de stockage privé chiffré avec Row Level Security (RLS). Seul votre compte peut y accéder depuis vos appareils."
            }
          },
          {
            "@type": "Question",
            "name": "Puis-je modifier les étapes ou ajouter mes propres notes de crochet ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. Chaque étape peut être modifiée à tout moment pour ajuster une formule ou corriger une coquille. Vous pouvez également ajouter des notes personnelles sur chaque rang pour vous souvenir de vos choix de fil, tension ou astuces."
            }
          }
        ]
      },
      {
        "@type": "HowTo",
        "@id": "https://stepbystitch.app/#howto",
        "name": "Comment suivre et traduire un patron de crochet avec StepByStitch",
        "description": "Guide étape par étape pour transformer un patron PDF ou une capture d'écran en instructions de crochet interactives.",
        "step": [
          {
            "@type": "HowToStep",
            "name": "1. Importez votre patron",
            "text": "Glissez-déposez votre fichier PDF ou vos captures d'écran de patron crochet."
          },
          {
            "@type": "HowToStep",
            "name": "2. Suivez rang par rang",
            "text": "Votre patron est découpé en une checklist claire. Cochez chaque rang terminé au fil de votre avancée."
          },
          {
            "@type": "HowToStep",
            "name": "3. Traduisez et annotez à la demande",
            "text": "Cliquez sur 'Traduire' pour convertir les termes anglophones en français et écrivez vos remarques personnelles."
          }
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://stepbystitch.app/#organization",
        "name": "StepByStitch",
        "url": "https://stepbystitch.app",
        "logo": "https://stepbystitch.app/logo.png"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
