import { useAppStore } from '@/store/appStore';

export type Language = 'en' | 'fr' | 'de';

type TranslationKey =
  | 'offers_tab'
  | 'amenities_tab'
  | 'hide_panel'
  | 'show_panel'
  | 'no_offers_title'
  | 'no_offers_subtitle'
  | 'search_with_nestai'
  | 'set_budget'
  | 'chat_placeholder'
  | 'search_homes'
  | 'loading_amenities'
  | 'no_amenities'
  | 'language_label'
  | 'settings_title'
  | 'dark_mode'
  | 'default_city'
  | 'default_radius'
  | 'default_listing_type'
  | 'rent'
  | 'buy'
  | 'all_cities'
  | 'done'
  | 'location_title'
  | 'location_subtitle'
  | 'search_placeholder'
  | 'use_my_location'
  | 'pick_on_map'
  | 'try_demo_mode'
  | 'searching'
  | 'or'
  | 'quick_chip_quieter'
  | 'quick_chip_parks'
  | 'quick_chip_transit'
  | 'quick_chip_cheaper'
  | 'quick_chip_schools'
  | 'quick_chip_fitness'
  | 'loading_listings'
  | 'loading_properties'
  | 'amenity_groceries'
  | 'amenity_parks'
  | 'amenity_schools'
  | 'amenity_transit'
  | 'amenity_healthcare'
  | 'amenity_fitness'
  | 'offer_details'
  | 'selected'
  | 'select'
  | 'pros'
  | 'cons'
  | 'open_listing'
  | 'more_info'
  | 'posted'
  | 'area'
  | 'rooms'
  | 'deposit'
  | 'furnished'
  | 'yes'
  | 'no'
  | 'requirements'
  | 'nearby_amenities'
  | 'view_on_map'
  | 'amenities_not_available'
  | 'recenter_map'
  | 'change_location'
  | 'searching_within'
  | 'km_of'
  | 'compare_listings'
  | 'select_two_listings'
  | 'close'
  | 'quick_decision_guide'
  | 'nearby';

const translations: Record<TranslationKey, Record<Language, string>> = {
  offers_tab: {
    en: 'Offers',
    fr: 'Offres',
    de: 'Angebote',
  },
  amenities_tab: {
    en: 'Amenities',
    fr: 'Commodités',
    de: 'Ausstattung',
  },
  hide_panel: {
    en: 'Hide panel',
    fr: 'Masquer le panneau',
    de: 'Panel ausblenden',
  },
  show_panel: {
    en: 'Show panel',
    fr: 'Afficher le panneau',
    de: 'Panel anzeigen',
  },
  no_offers_title: {
    en: 'No offers yet',
    fr: 'Aucune offre pour le moment',
    de: 'Noch keine Angebote',
  },
  no_offers_subtitle: {
    en: 'Ask NestAI to search for rentals',
    fr: 'Demandez à NestAI de chercher des locations',
    de: 'Frag NestAI nach Mietangeboten',
  },
  search_with_nestai: {
    en: 'Search with NestAI',
    fr: 'Chercher avec NestAI',
    de: 'Mit NestAI suchen',
  },
  set_budget: {
    en: 'Set your budget:',
    fr: 'Fixez votre budget :',
    de: 'Budget festlegen:',
  },
  chat_placeholder: {
    en: "Ask about the area or describe what you're looking for...",
    fr: 'Parlez du quartier ou décrivez votre recherche...',
    de: 'Frag nach der Gegend oder beschreibe, was du suchst...',
  },
  search_homes: {
    en: 'Search homes',
    fr: 'Rechercher des logements',
    de: 'Wohnungen suchen',
  },
  loading_amenities: {
    en: 'Loading amenities...',
    fr: 'Chargement des commodités...',
    de: 'Ausstattung wird geladen...',
  },
  no_amenities: {
    en: 'Search for listings to see nearby amenities',
    fr: 'Lancez une recherche pour voir les commodités proches',
    de: 'Suche, um nahegelegene Ausstattung zu sehen',
  },
  language_label: {
    en: 'Language',
    fr: 'Langue',
    de: 'Sprache',
  },
  settings_title: {
    en: 'Settings',
    fr: 'Paramètres',
    de: 'Einstellungen',
  },
  dark_mode: {
    en: 'Dark Mode',
    fr: 'Mode sombre',
    de: 'Dunkelmodus',
  },
  default_city: {
    en: 'Default City',
    fr: 'Ville par défaut',
    de: 'Standardstadt',
  },
  default_radius: {
    en: 'Default Search Radius',
    fr: 'Rayon de recherche par défaut',
    de: 'Standard-Suchradius',
  },
  default_listing_type: {
    en: 'Default Listing Type',
    fr: "Type d'annonce par défaut",
    de: 'Standardangebotstyp',
  },
  rent: { en: 'Rent', fr: 'Louer', de: 'Mieten' },
  buy: { en: 'Buy', fr: 'Acheter', de: 'Kaufen' },
  all_cities: { en: 'All Cities', fr: 'Toutes les villes', de: 'Alle Städte' },
  done: { en: 'Done', fr: 'Terminé', de: 'Fertig' },
  location_title: {
    en: 'Find your perfect home',
    fr: 'Trouvez votre maison idéale',
    de: 'Finde dein perfektes Zuhause',
  },
  location_subtitle: {
    en: 'Search by city, neighborhood, or address to explore amenities and listings',
    fr: 'Recherchez par ville, quartier ou adresse pour explorer commodités et annonces',
    de: 'Suche nach Stadt, Viertel oder Adresse, um Angebote und Umgebung zu erkunden',
  },
  search_placeholder: {
    en: 'Search city, neighborhood, address...',
    fr: 'Recherchez ville, quartier, adresse...',
    de: 'Suche Stadt, Viertel, Adresse...',
  },
  use_my_location: {
    en: 'Use my location',
    fr: 'Utiliser ma position',
    de: 'Meinen Standort verwenden',
  },
  pick_on_map: {
    en: 'Pick on map',
    fr: 'Choisir sur la carte',
    de: 'Auf der Karte wählen',
  },
  try_demo_mode: {
    en: 'Try Demo Mode',
    fr: 'Essayer le mode démo',
    de: 'Demo-Modus ausprobieren',
  },
  searching: {
    en: 'Searching...',
    fr: 'Recherche...',
    de: 'Suche läuft...',
  },
  or: { en: 'or', fr: 'ou', de: 'oder' },
  quick_chip_quieter: { en: 'Quieter', fr: 'Plus calme', de: 'Ruhiger' },
  quick_chip_parks: { en: 'More parks', fr: 'Plus de parcs', de: 'Mehr Parks' },
  quick_chip_transit: { en: 'Closer transit', fr: 'Transport proche', de: 'Nähe ÖPNV' },
  quick_chip_cheaper: { en: 'Cheaper', fr: 'Moins cher', de: 'Günstiger' },
  quick_chip_schools: { en: 'Better schools', fr: 'Meilleures écoles', de: 'Bessere Schulen' },
  quick_chip_fitness: { en: 'More fitness', fr: 'Plus de fitness', de: 'Mehr Fitness' },
  loading_listings: {
    en: 'Finding rentals...',
    fr: 'Recherche de locations...',
    de: 'Suche nach Mietobjekten...',
  },
  loading_properties: {
    en: 'Finding properties...',
    fr: 'Recherche de biens...',
    de: 'Suche nach Immobilien...',
  },
  amenity_groceries: { en: 'Groceries', fr: 'Courses', de: 'Lebensmittel' },
  amenity_parks: { en: 'Parks & Gardens', fr: 'Parcs & Jardins', de: 'Parks & Gärten' },
  amenity_schools: { en: 'Schools & Education', fr: 'Écoles & Éducation', de: 'Schulen & Bildung' },
  amenity_transit: { en: 'Public Transit', fr: 'Transports', de: 'ÖPNV' },
  amenity_healthcare: { en: 'Healthcare', fr: 'Santé', de: 'Gesundheit' },
  amenity_fitness: { en: 'Fitness & Sports', fr: 'Fitness & Sport', de: 'Fitness & Sport' },
  offer_details: { en: 'Offer Details', fr: "Détails de l'offre", de: 'Angebotsdetails' },
  selected: { en: 'Selected', fr: 'Sélectionné', de: 'Ausgewählt' },
  select: { en: 'Select', fr: 'Sélectionner', de: 'Auswählen' },
  pros: { en: 'Pros', fr: 'Atouts', de: 'Vorteile' },
  cons: { en: 'Cons', fr: 'Points faibles', de: 'Nachteile' },
  open_listing: { en: 'Open Listing', fr: "Ouvrir l'annonce", de: 'Anzeige öffnen' },
  more_info: { en: 'More Info', fr: 'Plus d’infos', de: 'Mehr Infos' },
  posted: { en: 'Posted', fr: 'Publié', de: 'Veröffentlicht' },
  area: { en: 'Area', fr: 'Surface', de: 'Fläche' },
  rooms: { en: 'Rooms', fr: 'Pièces', de: 'Zimmer' },
  deposit: { en: 'Deposit', fr: 'Dépôt', de: 'Kaution' },
  furnished: { en: 'Furnished', fr: 'Meublé', de: 'Möbliert' },
  yes: { en: 'Yes', fr: 'Oui', de: 'Ja' },
  no: { en: 'No', fr: 'Non', de: 'Nein' },
  requirements: { en: 'Requirements', fr: 'Exigences', de: 'Anforderungen' },
  nearby_amenities: { en: 'Nearby Amenities', fr: 'Commodités proches', de: 'Nahe Annehmlichkeiten' },
  view_on_map: { en: 'View on map', fr: 'Voir sur la carte', de: 'Auf Karte ansehen' },
  amenities_not_available: {
    en: 'Amenities not available for this offer.',
    fr: 'Pas de commodités pour cette offre.',
    de: 'Keine Annehmlichkeiten für dieses Angebot.',
  },
  recenter_map: { en: 'Recenter map', fr: 'Recentrer la carte', de: 'Karte zentrieren' },
  change_location: { en: 'Change location', fr: 'Changer de lieu', de: 'Ort ändern' },
  searching_within: { en: 'Searching within', fr: 'Recherche dans un rayon de', de: 'Suche innerhalb von' },
  km_of: { en: 'km of', fr: 'km de', de: 'km von' },
  compare_listings: { en: 'Compare Listings', fr: 'Comparer les annonces', de: 'Angebote vergleichen' },
  select_two_listings: {
    en: 'Select exactly 2 listings to compare',
    fr: 'Sélectionnez exactement 2 annonces à comparer',
    de: 'Wähle genau 2 Angebote zum Vergleichen',
  },
  close: { en: 'Close', fr: 'Fermer', de: 'Schließen' },
  quick_decision_guide: {
    en: 'Quick Decision Guide',
    fr: 'Guide décision rapide',
    de: 'Schneller Entscheidungsleitfaden',
  },
  nearby: { en: 'Nearby', fr: 'À proximité', de: 'In der Nähe' },
};

export function useI18n() {
  const language = useAppStore((s) => s.language);
  return (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };
}
