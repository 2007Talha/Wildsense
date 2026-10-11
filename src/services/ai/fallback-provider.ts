import type { AIProvider } from './ai-service';
import type { Mission, MissionGenerationParams, MissionCategory } from '../../types';
import birdMissions from '../../data/missions/birds.json';
import plantMissions from '../../data/missions/plants.json';
import insectMissions from '../../data/missions/insects.json';
import forestMissions from '../../data/missions/forests.json';
import mindfulnessMissions from '../../data/missions/mindfulness.json';

type RawMission = {
  title: string;
  description: string;
  category: string;
  duration: number;
  difficulty: string;
  environment: string;
  mood?: string;
  equipment: string[];
  tasks: string[];
  observationTips: string[];
  natureFacts: string[];
  reflectionQuestion: string;
  safetyReminder?: string;
};

const CURATED_MISSIONS: Record<string, RawMission[]> = {
  birds: birdMissions as RawMission[],
  plants: plantMissions as RawMission[],
  insects: insectMissions as RawMission[],
  forests: forestMissions as RawMission[],
  mindfulness: mindfulnessMissions as RawMission[],
};

export class FallbackProvider implements AIProvider {
  readonly name = 'Curated Library';
  readonly isLocal = true;

  async checkAvailability(): Promise<boolean> {
    return true; // Always available
  }

  async generateMission(params: MissionGenerationParams): Promise<Mission> {
    const category = params.category === 'general' ? this.randomCategory() : params.category;
    const pool = CURATED_MISSIONS[category] || CURATED_MISSIONS.mindfulness;

    // Filter by difficulty and duration, then relax constraints if needed
    let candidates = pool.filter(
      (m) => m.difficulty === params.difficulty && m.duration <= params.duration
    );
    if (candidates.length === 0) {
      candidates = pool.filter((m) => m.duration <= params.duration + 15);
    }
    if (candidates.length === 0) {
      candidates = pool;
    }

    const raw = candidates[Math.floor(Math.random() * candidates.length)];
    const id = crypto.randomUUID();

    return {
      id,
      title: raw.title,
      description: raw.description,
      category: category as MissionCategory,
      duration: raw.duration,
      difficulty: raw.difficulty as Mission['difficulty'],
      environment: (raw.environment || params.environment) as Mission['environment'],
      mood: (raw.mood || params.mood) as Mission['mood'],
      equipment: raw.equipment || [],
      tasks: raw.tasks.map((desc, i) => ({
        id: `${id}-task-${i}`,
        description: desc,
        completed: false,
        order: i,
      })),
      observationTips: raw.observationTips || [],
      natureFacts: raw.natureFacts || [],
      reflectionQuestion: raw.reflectionQuestion || 'What surprised you about today\'s adventure?',
      safetyReminder: raw.safetyReminder,
      source: 'curated',
      createdAt: new Date(),
    };
  }

  async askNaturalist(query: string): Promise<import('../../types').NaturalistResponse> {
    const raw = (query || '').trim();
    const q = raw.toLowerCase();

    // 1. Minimum length and gibberish check
    if (raw.length < 3) {
      return {
        notFound: true,
        error: `Query "${raw}" is too short to identify a nature specimen.`,
        answer: 'Please provide a more descriptive observation (at least 3 characters) detailing physical traits, colors, habitat, or the organism name.',
        suggestedName: 'Query Too Short',
        category: 'other',
        confidenceText: 'Not Found',
        confidence: 0,
        characteristics: [],
        natureFacts: [],
        ecologicalContext: 'Unable to evaluate biodiversity without descriptive input.',
        safetyCaution: 'Enter a recognizable outdoor nature observation.',
        source: 'offline-guide',
      };
    }

    // Repetitive or keyboard smash check
    const isKeyboardSmash = /^([a-z0-9])\1{3,}$/i.test(raw) || 
      /^(asdf|qwerty|zxcv|1234|jkl;|ghjk|qwer|poiuy|lkjh)/i.test(raw) ||
      (!/[aeiouy]/i.test(raw) && raw.length > 4);

    if (isKeyboardSmash) {
      return {
        notFound: true,
        error: `Unrecognized text "${raw}". No matching biological or geological specimen found.`,
        answer: `"${raw}" does not correspond to any known species, plant, animal, fungus, or natural outdoor feature. WildSense identifies real outdoor nature. Please provide recognizable words describing an organism or trail discovery.`,
        suggestedName: 'Unrecognized Query',
        category: 'other',
        confidenceText: 'Not Found',
        confidence: 0,
        characteristics: [],
        natureFacts: [],
        ecologicalContext: 'No corresponding organism or habitat was found in taxonomy.',
        safetyCaution: 'Verify your query describes an outdoor organism.',
        suggestedFollowUp: 'Try describing colors, size, leaves, plumage, or where on the trail you found it.',
        source: 'offline-guide',
      };
    }

    // 2. Explicit non-nature / artificial / manufactured items check
    const nonNatureKeywords = [
      'car', 'truck', 'bus', 'van', 'automobile', 'motorcycle', 'bike', 'bicycle', 'train', 'airplane', 'plane',
      'iphone', 'android', 'phone', 'cellphone', 'smartphone', 'laptop', 'computer', 'pc', 'tablet', 'screen',
      'keyboard', 'mouse', 'wifi', 'bluetooth', 'charger', 'battery', 'cable', 'wire',
      'tv', 'television', 'microwave', 'refrigerator', 'fridge', 'oven', 'stove', 'fan', 'ac', 'air conditioner',
      'table', 'chair', 'desk', 'couch', 'sofa', 'bed', 'closet', 'furniture', 'lamp', 'bulb',
      'crypto', 'bitcoin', 'ethereum', 'wallet', 'token', 'blockchain',
      'code', 'coding', 'software', 'programming', 'javascript', 'python', 'html', 'css', 'react', 'app',
      'shoe', 'shoes', 'sneaker', 'boots', 'shirt', 'pants', 'jeans', 'jacket', 'coat', 'hat', 'clothing',
      'plastic', 'nylon', 'polyester', 'concrete', 'asphalt', 'brick', 'metal', 'steel', 'aluminum', 'glass bottle',
      'pizza', 'burger', 'sandwich', 'french fries', 'soda', 'coca cola', 'pepsi', 'cookie', 'cake',
      'who is', 'what is the capital', 'tell me a joke', 'how to make money'
    ];

    const hasNonNatureWord = nonNatureKeywords.some((term) => {
      const reg = new RegExp(`\\b${term}\\b`, 'i');
      return reg.test(q);
    });

    // Nature check terms to allow queries like "bird perched on a car"
    const natureOverrideTerms = [
      'bird', 'plant', 'leaf', 'flower', 'tree', 'insect', 'mushroom', 'fungus', 'moss',
      'spider', 'feather', 'bark', 'pine', 'oak', 'fer', 'nest', 'track', 'caterpillar'
    ];
    const hasNatureOverride = natureOverrideTerms.some((term) => q.includes(term));

    if (hasNonNatureWord && !hasNatureOverride) {
      return {
        notFound: true,
        error: `Non-nature item detected: "${raw}". WildSense only identifies natural flora, fauna, fungi, and wildlife.`,
        answer: `This inquiry appears to describe an artificial, manufactured, technological, or non-living human object rather than a wild nature specimen. WildSense is built specifically to explore and identify outdoor ecosystems: plants, birds, insects, trees, fungi, tracks, and wildlife.`,
        suggestedName: 'Not an Outdoor Nature Specimen',
        category: 'other',
        confidenceText: 'Non-Nature Query',
        confidence: 0,
        characteristics: [],
        natureFacts: [],
        ecologicalContext: 'Manufactured and artificial items belong to the built human environment, not natural outdoor ecosystems.',
        safetyCaution: 'Please ask about living flora, fauna, fungi, tracks, or geological features found in nature.',
        suggestedFollowUp: 'Look around on your outdoor walk for interesting leaves, wild blooms, bird songs, or tree bark.',
        source: 'offline-guide',
      };
    }

    // 3. Rich Taxonomy & Species Knowledge Base

    // SPECIFIC SPECIES & PHENOMENA
    // A. Blue Jay / Blue feather
    if (q.includes('blue feather') || q.includes('blue jay') || (q.includes('feather') && q.includes('blue'))) {
      return {
        notFound: false,
        answer: 'You have found the feather of a Blue Jay (Cyanocitta cristata)! Interestingly, the brilliant blue color is not a pigment — it is structural coloration created by microscopic light refraction through keratin cells.',
        suggestedName: 'Blue Jay (Cyanocitta cristata) Feather',
        category: 'bird',
        confidenceText: 'High Confidence Match',
        confidence: 0.94,
        characteristics: ['Bright sky-blue barbules with distinct black cross-bars', 'White outer edging or tip', 'Hollow translucent central shaft (rachis)'],
        natureFacts: [
          'Blue Jay feathers are actually brown pigment (melanin); microscopic air pockets scatter light to make them appear vivid blue.',
          'Blue Jays are renowned for caching thousands of acorns every autumn, effectively planting oak forests.'
        ],
        ecologicalContext: 'Blue Jays are vital forest regenerators, dispersing acorns and nuts miles away from parent trees.',
        safetyCaution: 'In North America, the Migratory Bird Treaty Act protects wild native bird feathers. Admire and photograph in place.',
        suggestedFollowUp: 'Check the nearby tree branches: do you hear their raucous "jay-jay" call or see an oak canopy?',
        source: 'offline-guide',
      };
    }

    // B. American Robin / Rust-breasted bird
    if (q.includes('robin') || (q.includes('red breast') || q.includes('rust breast') || q.includes('orange breast'))) {
      return {
        notFound: false,
        answer: 'This is an American Robin (Turdus migratorius), one of North America\'s most celebrated songbirds. Recognizable by its rich reddish-orange breast and lively upright hopping stance.',
        suggestedName: 'American Robin (Turdus migratorius)',
        category: 'bird',
        confidenceText: 'High Confidence Match',
        confidence: 0.95,
        characteristics: ['Rich brick-red to orange breast', 'Dark charcoal head and slate-gray back', 'White eye crescents and bright yellow bill'],
        natureFacts: [
          'Robins locate earthworms underground using keen sight and subtle acoustic/vibrational sensitivity.',
          'Robin eggs are an iconic vibrant pastel cyan blue due to biliverdin pigment deposited by the female.'
        ],
        ecologicalContext: 'Robins act as indicators of lawn and soil health, feeding extensively on earthworms and summer berries.',
        safetyCaution: 'Harmless songbird. Keep dogs leashed near low shrubs where fledglings learn to fly.',
        suggestedFollowUp: 'Notice how it cocks its head to the side when foraging — it is peering directly into the grass roots.',
        source: 'offline-guide',
      };
    }

    // C. Woolly Bear Caterpillar
    if (q.includes('woolly bear') || q.includes('wooly bear') || (q.includes('caterpillar') && (q.includes('orange band') || q.includes('black band') || q.includes('fuzzy')))) {
      return {
        notFound: false,
        answer: 'This is the famous Woolly Bear Caterpillar, the larval stage of the Isabella Tiger Moth (Pyrrharctia isabella). Dense bristly setae cover its body with a rust-colored middle band.',
        suggestedName: 'Banded Woolly Bear (Pyrrharctia isabella)',
        category: 'insect',
        confidenceText: 'High Confidence Match',
        confidence: 0.96,
        characteristics: ['Dense bristling black setae at head and tail ends', 'Rusty reddish-orange band in the middle', 'Rolls into a tight defensive ball when handled'],
        natureFacts: [
          'Woolly bears produce glycerol, a natural antifreeze that allows their bodily tissues to safely freeze solid during winter.',
          'Folklore suggests the width of their orange band predicts winter severity, though it actually reflects larval age and moisture levels.'
        ],
        ecologicalContext: 'Feeds on broadleaf weeds such as plantain, dandelion, and clover before overwintering under leaf litter.',
        safetyCaution: 'Gentle and non-venomous, though individuals with sensitive skin may experience mild irritation from the stiff bristles.',
        suggestedFollowUp: 'Gently observe which direction it is crawling: in autumn, they wander purposefully in search of sheltered bark crevices.',
        source: 'offline-guide',
      };
    }

    // D. Shelf / Bracket Mushroom / Chicken of the Woods
    if (q.includes('shelf mushroom') || q.includes('bracket') || q.includes('chicken of the woods') || (q.includes('mushroom') && (q.includes('tree') || q.includes('log') || q.includes('rot')))) {
      return {
        notFound: false,
        answer: 'You have found a Polypore or Shelf Fungus (such as Laetiporus / Ganoderma / Trametes). Unlike gilled mushrooms, bracket fungi grow laterally out of dead or dying timber like woody shelves.',
        suggestedName: 'Bracket Fungus / Shelf Polypore (Polyporales)',
        category: 'fungus',
        confidenceText: 'Probable Match',
        confidence: 0.88,
        characteristics: ['Fan-shaped or semicircular brackets attached directly to wood without a stem', 'Underside composed of microscopic pores rather than gills', 'Tough, fibrous or woody texture'],
        natureFacts: [
          'Polypores produce billions of microscopic spores that drift on gentle thermals to colonize fallen forest timber.',
          'Some bracket fungi, like the Artist\'s Conk, produce annual growth rings and can live for decades on a single trunk.'
        ],
        ecologicalContext: 'Vital decomposers: they break down complex lignin and cellulose, turning fallen giants into fertile woodland humus.',
        safetyCaution: 'NEVER harvest or consume wild fungi based on field identification. Many bracket species are tough, bitter, or toxic.',
        suggestedFollowUp: 'Feel the underside gently: is it soft and porous like sponge, or hard like wood?',
        source: 'offline-guide',
      };
    }

    // E. Poison Ivy / Three leaves
    if (q.includes('poison ivy') || (q.includes('three leaves') || q.includes('shiny leaves') || q.includes('white berries'))) {
      return {
        notFound: false,
        answer: 'CAUTION: This strongly matches Eastern Poison Ivy (Toxicodendron radicans). Remember the classic field naturalist rule: "Leaves of three, let it be; berries white, danger in sight."',
        suggestedName: 'Poison Ivy (Toxicodendron radicans)',
        category: 'plant',
        confidenceText: 'High Confidence Match — Safety Caution',
        confidence: 0.93,
        characteristics: ['Compound leaf with three distinct leaflets', 'Middle leaflet has a longer stem than the two side leaflets', 'Trailing ground vine or hairy climbing aerial vine with off-white berries'],
        natureFacts: [
          'Urushiol oil remains active on dead plant stems and clothing for years if not washed off with soap and cool water.',
          'Despite causing dermatitis in humans, poison ivy berries are a prized, non-toxic winter energy source for over 60 songbird species.'
        ],
        ecologicalContext: 'Native pioneer vine that stabilizes forest edges and provides nutritious berries for wintering wildlife.',
        safetyCaution: 'DO NOT TOUCH! Urushiol resin causes severe blistering contact dermatitis. Wash exposed skin with cold water and degreasing soap immediately.',
        suggestedFollowUp: 'Step back to the trail center and note if the vine is growing along the ground or climbing hairy roots up a tree trunk.',
        source: 'offline-guide',
      };
    }

    // F. Western Honeybee / Bumblebee
    if (q.includes('bee') || q.includes('bumblebee') || q.includes('honeybee')) {
      return {
        notFound: false,
        answer: 'You have spotted a native pollinator or Western Honeybee (Apis mellifera). Bees are the foundational pollinators of terrestrial flowering plants and wild meadows.',
        suggestedName: 'Honeybee / Bumblebee (Apidae)',
        category: 'insect',
        confidenceText: 'High Confidence Match',
        confidence: 0.95,
        characteristics: ['Hairy thorax and abdomen for pollen adhesion', 'Corbiculae (pollen baskets) on hind legs', 'Two pairs of linked membranous wings'],
        natureFacts: [
          'A single bee colony will visit millions of flowers each season, flying the equivalent of three times around the Earth.',
          'Bees communicate floral locations using a polarized-light "waggle dance" indicating distance and azimuth angle.'
        ],
        ecologicalContext: 'Pollinates over 80% of wildflowers, agricultural crops, and native fruit shrubs.',
        safetyCaution: 'Peaceful when foraging. Stand calmly and do not swat or block flight paths to hives.',
        suggestedFollowUp: 'Look closely at the hind legs: are the pollen baskets packed with bright yellow or orange pollen pellets?',
        source: 'offline-guide',
      };
    }

    // G. Oak Tree / Acorns
    if (q.includes('oak') || q.includes('acorn') || q.includes('quercus')) {
      return {
        notFound: false,
        answer: 'This is an Oak tree (Quercus genus), a keystone species of temperate woodland ecosystems recognized by its deeply lobed leaves and woody acorn caps.',
        suggestedName: 'Oak Tree (Quercus sp.)',
        category: 'plant',
        confidenceText: 'High Confidence Match',
        confidence: 0.96,
        characteristics: ['Alternate lobed leaves (rounded in white oaks, pointed/bristled in red oaks)', 'Acorn nuts seated in woody cupules', 'Deeply ridged, furrowed mature bark'],
        natureFacts: [
          'A single mature oak tree can host and nourish over 500 species of native Lepidoptera caterpillars and invertebrates.',
          'Oaks can absorb up to 50 gallons of groundwater per day and live for well over 400 years.'
        ],
        ecologicalContext: 'Top keystone species supporting woodland food webs from fungi and insects to birds and deer.',
        safetyCaution: 'Completely safe to observe. Look for insect galls on twig joints and fallen leaves.',
        suggestedFollowUp: 'Examine the tips of the leaf lobes: are they rounded (White Oak group) or sharp and pointed (Red Oak group)?',
        source: 'offline-guide',
      };
    }

    // H. Pine / Evergreen Conifer
    if (q.includes('pine') || q.includes('conifer') || q.includes('needle') || q.includes('pinecone')) {
      return {
        notFound: false,
        answer: 'This is a Pine tree (Pinus genus), an ancient gymnosperm conifer adapted with slender needle-like leaves and resinous wood that withstands cold and drought.',
        suggestedName: 'Pine Conifer (Pinus sp.)',
        category: 'plant',
        confidenceText: 'High Confidence Match',
        confidence: 0.93,
        characteristics: ['Needle-like foliage clustered in bundles (fascicles) of 2, 3, or 5', 'Woody seed cones with overlapping scales', 'Distinct aromatic scent of natural pinene terpenes'],
        natureFacts: [
          'Pine needles possess a thick waxy cuticle and sunken stomata, preventing desiccation in sub-zero winter temperatures.',
          'Bristlecone pines in western North America are among the oldest known living organisms on Earth (over 4,800 years old).'
        ],
        ecologicalContext: 'Provides dense winter canopy cover, shelter, and nutritious cone seeds for crossbills and squirrels.',
        safetyCaution: 'Pine resin is sticky but non-toxic. Watch for slippery needle carpeting on downhill trail sections.',
        suggestedFollowUp: 'Count how many needles grow out of a single bundle (fascicle): 2, 3, or 5? This reveals the exact pine group.',
        source: 'offline-guide',
      };
    }

    // I. Fern / Fronds
    if (q.includes('fern') || q.includes('fiddlehead') || q.includes('frond')) {
      return {
        notFound: false,
        answer: 'You are observing a Fern (Polypodiopsida), an ancient vascular plant lineage that reproduces via microscopic spores rather than flowers or seeds.',
        suggestedName: 'Woodland Fern (Polypodiopsida)',
        category: 'plant',
        confidenceText: 'High Confidence Match',
        confidence: 0.94,
        characteristics: ['Feathery, dissected fronds unfurling from tightly spiraled fiddleheads (circinate vernation)', 'Clusters of spore sacs (sori) dotting the leaflet undersides in patterns', 'Thrives in dappled, humid shade and moisture-rich soils'],
        natureFacts: [
          'Ferns first appeared on Earth roughly 360 million years ago, over 200 million years before flowering plants evolved.',
          'Fern fiddleheads unfurl by expanding cells faster on their inner curve than their outer curve.'
        ],
        ecologicalContext: 'Forms lush woodland understory micro-habitats that retain moisture for salamanders, toads, and beetles.',
        safetyCaution: 'Leave wild ferns in their soil. Many wild species have carcinogenic compounds; do not consume unless verified by an expert botanist.',
        suggestedFollowUp: 'Gently turn over a mature frond: do you see rows of small brown spots (sori) filled with spores?',
        source: 'offline-guide',
      };
    }

    // J. Dandelion / Yellow meadow bloom
    if (q.includes('dandelion') || (q.includes('yellow flower') && (q.includes('lawn') || q.includes('seed') || q.includes('puff')))) {
      return {
        notFound: false,
        answer: 'This is the Common Dandelion (Taraxacum officinale), a resilient composite flower of the Asteraceae family. Its French name "dent-de-lion" means lion\'s tooth, referring to the jagged leaf edges.',
        suggestedName: 'Common Dandelion (Taraxacum officinale)',
        category: 'plant',
        confidenceText: 'High Confidence Match',
        confidence: 0.95,
        characteristics: ['Bright yellow composite flower head containing up to 100 individual ray florets', 'Basal rosette of deeply toothed leaves with backward-pointing lobes', 'Fluffy spherical seed clock (pappus) designed for aerodynamic wind dispersal'],
        natureFacts: [
          'Dandelion taproots delve up to 10 feet deep, drawing calcium and iron up from subsoil into surface topsoil.',
          'They open with sunrise and close tightly at dusk or before oncoming rain.'
        ],
        ecologicalContext: 'Crucial early-spring nectar station for emerging solitary bees, hoverflies, and honeybees.',
        safetyCaution: 'Completely non-toxic, though plants along treated park turf or roadsides may harbor herbicides or exhaust fumes.',
        suggestedFollowUp: 'Look closely at the yellow flower: it is actually a composite bouquet of dozens of tiny individual petals.',
        source: 'offline-guide',
      };
    }

    // K. Moss / Lichen
    if (q.includes('moss') || q.includes('lichen')) {
      const isLichen = q.includes('lichen');
      return {
        notFound: false,
        answer: isLichen
          ? 'You have discovered Lichen! Lichens are not single organisms, but a symbiotic partnership between a fungus and a photosynthetic partner (algae or cyanobacteria).'
          : 'You are looking at Moss (Bryophyta), a non-vascular land plant that absorbs moisture and nutrients directly through its leaves without true roots.',
        suggestedName: isLichen ? 'Foliose / Crustose Lichen' : 'Woodland Moss (Bryophyta)',
        category: 'plant',
        confidenceText: 'High Confidence Match',
        confidence: 0.92,
        characteristics: [
          isLichen ? 'Crust-like, leafy, or branching growth firmly adhering to stone or bark' : 'Dense green miniature velvet cushions of micro-leaves',
          isLichen ? 'Remarkable slow growth (often under 1 mm per year)' : 'Non-vascular, anchoring via delicate hair-like rhizoids',
          'Highly sensitive bio-indicators of pure air and stable humidity'
        ],
        natureFacts: [
          isLichen
            ? 'Lichens absorb all their minerals directly from rainfall and air, making them exceptional environmental sensors for air purity.'
            : 'Mosses can lose up to 98% of their water content and survive in stasis, greening up within minutes of a rain shower.'
        ],
        ecologicalContext: 'Pioneers that weather bare stone into soil and provide nesting insulation for songbirds and micro-arthropods.',
        safetyCaution: 'Do not peel moss or lichens from tree bark or stones, as slow-growing colonies take decades to regenerate.',
        suggestedFollowUp: 'Gently touch the surface: is it cool and moist, or dry and crusty like paper?',
        source: 'offline-guide',
      };
    }

    // L. Animal Tracks / Paw prints
    if (q.includes('track') || q.includes('footprint') || q.includes('paw') || q.includes('claw') || q.includes('mud')) {
      const isRaccoon = q.includes('five') || q.includes('hand') || q.includes('raccoon');
      return {
        notFound: false,
        answer: isRaccoon
          ? 'These prints strongly suggest a Raccoon (Procyon lotor)! Their forefoot tracks look strikingly like miniature human hands with five long, dexterous fingers and faint claw tips.'
          : 'You have found wild mammal tracks in the substrate. Animal gait patterns, toe counts, and claw marks reveal speed, direction, and species identity.',
        suggestedName: isRaccoon ? 'Raccoon Track (Procyon lotor)' : 'Wild Mammal Track / Trail Sign',
        category: 'mammal',
        confidenceText: 'Probable Match',
        confidence: 0.87,
        characteristics: ['Five slender finger-like toes on front foot with tiny claw marks', 'C-shaped heel pad or elongated hind foot imprint', 'Frequently located near streams, creek banks, or mud crossings'],
        natureFacts: [
          'Raccoons have specialized tactile nerve clusters in their front paws that become exponentially more sensitive when moistened in water.',
          'Tracking in mud or fresh sand allows naturalists to read whole behavioral stories without disturbing wildlife.'
        ],
        ecologicalContext: 'Mid-sized omnivores that forage for freshwater mollusks, frogs, fruit, and insects along aquatic margins.',
        safetyCaution: 'Observe tracks peacefully. Do not approach dens or wild mammals.',
        suggestedFollowUp: 'Check the stride: can you see a matching hind footprint placed right next to or behind the front foot?',
        source: 'offline-guide',
      };
    }

    // M. Broad Category Catchers (Bird, Plant, Insect, Fungus, Mammal)
    const birdTerms = ['bird', 'feather', 'beak', 'wing', 'sparrow', 'hawk', 'eagle', 'duck', 'goose', 'crow', 'raven', 'owl', 'finch', 'heron', 'woodpecker'];
    if (birdTerms.some((t) => q.includes(t))) {
      return {
        notFound: false,
        answer: 'You have observed an avian species! Birds exhibit extraordinary adaptations in bill shape, plumage, and flight aerodynamics tailored to their ecological niche.',
        suggestedName: 'Wild Avian Specimen (Aves)',
        category: 'bird',
        confidenceText: 'Morphological Signature: Avian',
        confidence: 0.88,
        characteristics: ['Keratinized feathers designed for insulation and lift', 'Toothless beak adapted for specific diet (seeds, insects, nectar, or prey)', 'Keen visual acuity and hollow skeletal architecture'],
        natureFacts: [
          'Bird feathers are replaced through an annual molting cycle to preserve waterproofing and flight integrity.',
          'Birds descend directly from theropod dinosaurs and are the only dinosaur lineage to survive the Cretaceous extinction.'
        ],
        ecologicalContext: 'Essential seed dispersers, insect predators, and ecosystem health indicators.',
        safetyCaution: 'Observe wild birds from a respectful distance to avoid interrupting feeding or nesting behavior.',
        suggestedFollowUp: 'Listen carefully: can you hear its call, and what kind of bill shape did you see?',
        source: 'offline-guide',
      };
    }

    const plantTerms = ['plant', 'flower', 'tree', 'leaf', 'leaves', 'bark', 'bush', 'shrub', 'branch', 'bloom', 'petal', 'seed', 'sprout', 'ivy', 'vine'];
    if (plantTerms.some((t) => q.includes(t))) {
      return {
        notFound: false,
        answer: 'You have found a botanical subject! Plants display mathematical Fibonacci spiraling in leaf nodes and flower petals to maximize sunlight absorption and photosynthetic efficiency.',
        suggestedName: 'Wild Botanical / Flora Specimen',
        category: 'plant',
        confidenceText: 'Morphological Signature: Botanical',
        confidence: 0.87,
        characteristics: ['Chlorophyll-bearing photosynthetic tissue', 'Vein architecture supporting vascular nutrient transport', 'Characteristic leaf margin (lobed, serrate, or smooth)'],
        natureFacts: [
          'Plants communicate underground with neighboring trees through mycorrhizal fungal networks.',
          'When attacked by insects, many plants emit airborne volatile chemicals to alert nearby plants to produce tannins.'
        ],
        ecologicalContext: 'Primary producers forming the baseline biomass and oxygen generation for all terrestrial life.',
        safetyCaution: 'Do not taste or harvest unfamiliar wild plants. Avoid plants with three-leaf clusters or milky sap.',
        suggestedFollowUp: 'Are the leaves arranged opposite each other on the twig, or do they alternate?',
        source: 'offline-guide',
      };
    }

    const insectTerms = ['insect', 'bug', 'caterpillar', 'beetle', 'butterfly', 'moth', 'ant', 'dragonfly', 'spider', 'cricket', 'grasshopper', 'mantis'];
    if (insectTerms.some((t) => q.includes(t))) {
      return {
        notFound: false,
        answer: 'You have discovered a terrestrial invertebrate! Arthropods make up the overwhelming majority of animal biodiversity on Earth and drive crucial nutrient recycling.',
        suggestedName: 'Terrestrial Arthropod Specimen',
        category: 'insect',
        confidenceText: 'Morphological Signature: Invertebrate',
        confidence: 0.87,
        characteristics: ['Chitinous exoskeleton providing physical structure and moisture retention', 'Segmented body plan (head, thorax, abdomen if insect)', 'Sensory antennae specialized for pheromone and chemical tracking'],
        natureFacts: [
          'Insects possess compound eyes made of thousands of tiny lenses called ommatidia.',
          'Over 75% of flowering plants rely on insects for pollination to set seed.'
        ],
        ecologicalContext: 'Keystone pollinators, decomposers, and the primary food source for songbirds and amphibians.',
        safetyCaution: 'Observe without handling. Never corner stinging or defensive insects.',
        suggestedFollowUp: 'How many legs does it have: six (insect) or eight (arachnid)?',
        source: 'offline-guide',
      };
    }

    const fungusTerms = ['mushroom', 'fungus', 'fungi', 'toadstool', 'spore', 'mycelium', 'puffball', 'morel', 'chanterelle'];
    if (fungusTerms.some((t) => q.includes(t))) {
      return {
        notFound: false,
        answer: 'You have encountered a fungal fruiting body! What you see is only the temporary reproductive structure; the true organism is a vast underground mycelial web.',
        suggestedName: 'Wild Fungal Fruiting Body (Fungi)',
        category: 'fungus',
        confidenceText: 'Morphological Signature: Mycological',
        confidence: 0.88,
        characteristics: ['Cap (pileus) and stem (stipe) or shelf-like formation', 'Spore-bearing hymenium (gills, pores, or ridges)', 'Sprouts rapidly in moist substrate after rain'],
        natureFacts: [
          'Fungi are more closely related genetically to animals than they are to plants.',
          'A single mushroom cap can release billions of microscopic spores into wind currents.'
        ],
        ecologicalContext: 'The premier decomposers of Earth, recycling woody lignin and returning carbon to soil.',
        safetyCaution: 'CRITICAL SAFETY RULE: Never touch, taste, or harvest wild mushrooms. Many poisonous species closely mimic edible varieties.',
        suggestedFollowUp: 'Look under the cap: does it have radiating knife-like gills, or a spongy surface of tiny pores?',
        source: 'offline-guide',
      };
    }

    // 4. Default: Query could not be identified as a known nature specimen
    return {
      notFound: true,
      error: `Could not identify any known nature specimen for "${raw}".`,
      answer: `We were unable to recognize or match "${raw}" to any known wild plant, animal, bird, insect, fungus, or natural outdoor feature. WildSense identifies real outdoor nature. Please check your spelling or describe specific physical traits (e.g. "yellow bird with black wings", "spotted mushroom on oak log", "leaf with serrated edges").`,
      suggestedName: 'Specimen Not Found',
      category: 'other',
      confidenceText: 'Not Found',
      confidence: 0,
      characteristics: [],
      natureFacts: [],
      ecologicalContext: 'No corresponding organism or habitat was found in taxonomy.',
      safetyCaution: 'Verify that your observation describes a natural specimen found outdoors.',
      suggestedFollowUp: 'Try describing what you see: colors, shape, size, where it was growing, or what sound it made.',
      source: 'offline-guide',
    };
  }


  private randomCategory(): MissionCategory {
    const categories: MissionCategory[] = ['birds', 'plants', 'insects', 'forests', 'mindfulness'];
    return categories[Math.floor(Math.random() * categories.length)];
  }
}
