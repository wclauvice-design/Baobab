# Reconstruction du catalogue Westzone

Audit du 25 octobre 2026 : le générateur `generate_catalog_5200.py` crée des variantes, prix et stocks avec `random`, laisse `images` vide et ne conserve pas d'annonce fournisseur. Les liens du manifeste sont des recherches. L'ancien générateur `gen-catalog.py` choisit même le nom de la plateforme au hasard. Ce catalogue ne constitue pas un relevé d'offres fournisseur.

`catalog-original-5200.json` est la copie de sauvegarde du catalogue local. La production n'a pas été modifiée.

`source-backed-drafts.json` commence la reconstruction avec une annonce identifiable et ses propres photos. Il s'agit de brouillons, pas d'articles disponibles confirmés. Les références sources ne remplacent pas silencieusement les anciens SKU : finition, état, année et prix peuvent différer.

Règles : une fiche par annonce et variante exacte ; prix fournisseur et devise conservés ; majoration de 15 % calculée en décimal ; conversion XOF documentée ; aucun stock inventé ; photos de l'annonce, ordonnées et dédupliquées. Le nombre de photos est celui effectivement récupéré, pas le nombre annoncé lorsque toute la galerie n'est pas accessible.

Première fiche : Prado GXR blanc 2021 d'occasion, 84 527 km. Deux vues téléchargées et inspectées : trois-quarts avant, puis face avant. Treize photos annoncées par la source, deux récupérées. Prix de l'instantané : 131 999 AED ; majoré de 15 % : 151 798,85 AED avant conversion et transport. Prix courant et disponibilité restent à confirmer.
