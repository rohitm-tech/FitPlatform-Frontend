/** Ordered pattern list — heads/parts before group fallbacks. */
export const ANATOMY_MESH_PATTERNS: { slug: string; test: RegExp }[] = [
  // Chest
  { slug: 'upper-chest', test: /clavicular.*(pectoralis|head of pectoralis)|clavicular head of pectoralis/i },
  { slug: 'lower-chest', test: /abdominal part of pectoralis/i },
  { slug: 'middle-chest', test: /sternocostal.*(pectoralis|head of pectoralis)|sternocostal head of pectoralis/i },
  { slug: 'inner-chest', test: /pectoralis minor/i },
  { slug: 'middle-chest', test: /pectoralis major/i },

  // Delts (parts before aggregate)
  { slug: 'front-delts', test: /clavicular part of deltoid/i },
  { slug: 'side-delts', test: /acromial part of deltoid/i },
  { slug: 'rear-delts', test: /spinal part of deltoid|scapular spinal part of deltoid/i },
  { slug: 'side-delts', test: /^deltoid$|deltoid muscle/i },

  // Biceps brachii (exclude femoris)
  { slug: 'long-head-biceps', test: /long head of biceps brachii/i },
  { slug: 'short-head-biceps', test: /short head of biceps brachii/i },
  { slug: 'brachialis', test: /^brachialis$|brachialis muscle/i },
  { slug: 'biceps', test: /biceps brachii|(^biceps$)/i },

  // Triceps
  { slug: 'long-head-triceps', test: /long head of triceps brachii/i },
  { slug: 'lateral-head-triceps', test: /lateral head of triceps brachii/i },
  { slug: 'medial-head-triceps', test: /medial head of triceps brachii/i },
  { slug: 'triceps', test: /triceps/i },

  // Forearms
  { slug: 'brachioradialis', test: /brachioradialis/i },
  { slug: 'forearms', test: /forearm|flexor carpi|extensor carpi|pronator|supinator|anconeus/i },

  // Traps
  { slug: 'upper-traps', test: /descending part of trapezius/i },
  { slug: 'middle-traps', test: /transverse part of trapezius/i },
  { slug: 'lower-traps', test: /ascending part of trapezius/i },
  { slug: 'traps', test: /trapezius/i },

  { slug: 'rhomboids', test: /rhomboid/i },
  { slug: 'lats', test: /latissimus/i },
  { slug: 'upper-back', test: /infraspinatus|teres major|teres minor|serratus posterior/i },

  // Quads
  { slug: 'rectus-femoris', test: /rectus femoris/i },
  { slug: 'vastus-lateralis', test: /vastus lateralis/i },
  { slug: 'vastus-medialis', test: /vastus medialis/i },
  { slug: 'vastus-intermedius', test: /vastus intermedius/i },
  { slug: 'quadriceps', test: /quadriceps/i },

  // Hamstrings
  { slug: 'biceps-femoris-long', test: /long head of biceps femoris/i },
  { slug: 'biceps-femoris-short', test: /short head of biceps femoris/i },
  { slug: 'semitendinosus', test: /semitendinosus/i },
  { slug: 'semimembranosus', test: /semimembranosus/i },
  { slug: 'hamstrings', test: /^biceps femoris$|biceps femoris muscle/i },

  // Glutes / hips
  { slug: 'gluteus-maximus', test: /gluteus maximus/i },
  { slug: 'gluteus-medius', test: /gluteus medius/i },
  { slug: 'gluteus-minimus', test: /gluteus minimus/i },
  { slug: 'glutes', test: /gluteal muscles|^gluteus$/i },
  { slug: 'hip-flexors', test: /iliopsoas|iliacus|psoas major|tensor fasciae latae|tensor fascia lata/i },
  { slug: 'adductors', test: /adductor (longus|magnus|brevis)|(^pectineus$|pectineus muscle)|(^gracilis$|gracilis muscle)/i },

  // Calves
  { slug: 'medial-gastrocnemius', test: /medial head of gastrocnemius/i },
  { slug: 'lateral-gastrocnemius', test: /lateral head of gastrocnemius/i },
  { slug: 'soleus', test: /^soleus$|soleus muscle/i },
  { slug: 'calves', test: /^gastrocnemius$/i },

  // Core (avoid eye/foot "oblique" muscles)
  { slug: 'upper-abs', test: /rectus abdominis/i },
  { slug: 'lower-abs', test: /pyramidalis|transversus abdominis|transverse abdominal/i },
  { slug: 'obliques', test: /(?:abdominal (?:external|internal) oblique|(?:external|internal) abdominal oblique)/i },
];

/**
 * When several muscles are nearly coplanar under the cursor (common with
 * wrapping lats over the abs), prefer anterior/core slugs over back slugs.
 */
export const SLUG_PICK_PRIORITY: Record<string, number> = {
  'upper-abs': 100,
  'lower-abs': 100,
  'obliques': 95,
  'upper-chest': 85,
  'middle-chest': 85,
  'lower-chest': 85,
  'inner-chest': 80,
  'hip-flexors': 75,
  'front-delts': 60,
  'side-delts': 55,
  'rear-delts': 15,
  lats: 5,
  traps: 5,
  'upper-traps': 5,
  'middle-traps': 5,
  'lower-traps': 5,
  'upper-back': 5,
  rhomboids: 5,
};

export function pickPriority(slug: string): number {
  return SLUG_PICK_PRIORITY[slug] ?? 40;
}

const NOISE =
  /bursa|fossa|tubercle|tuberosity|ligament|tendon sheath|facet|notch|crest|line of|canal |process|symphysis|epiphysis|bone|vertebra|skull|rib|femur|tibia|fibula|humerus|radius|ulna|carpal|tarsal|phalange|skin|fat|nerve|artery|vein|cartilage/i;

export function resolveAnatomyMeshToSlug(meshName: string): string | null {
  if (!meshName || NOISE.test(meshName)) return null;
  for (const entry of ANATOMY_MESH_PATTERNS) {
    if (entry.test.test(meshName)) return entry.slug;
  }
  return null;
}

export function isLikelyMuscleMesh(meshName: string): boolean {
  if (!meshName || NOISE.test(meshName)) return false;
  if (
    /muscle|deltoid|pectoralis|trapezius|latissimus|rhomboid|oblique|abdominis|gluteus|vastus|gastrocnemius|soleus|biceps|triceps|brachialis|brachioradialis|femoris|semitendinosus|semimembranosus|iliopsoas|iliacus|psoas|adductor|pectineus|gracilis/i.test(
      meshName,
    )
  ) {
    return true;
  }
  return resolveAnatomyMeshToSlug(meshName) !== null;
}

const GROUP_KEYS:Record<string,string>={"long-head-biceps": "biceps", "short-head-biceps": "biceps", "brachialis": "biceps", "long-head-triceps": "triceps", "lateral-head-triceps": "triceps", "medial-head-triceps": "triceps", "brachioradialis": "forearms", "upper-traps": "traps", "middle-traps": "traps", "lower-traps": "traps", "rectus-femoris": "quadriceps", "vastus-lateralis": "quadriceps", "vastus-medialis": "quadriceps", "vastus-intermedius": "quadriceps", "adductors": "quadriceps", "biceps-femoris-long": "hamstrings", "biceps-femoris-short": "hamstrings", "semitendinosus": "hamstrings", "semimembranosus": "hamstrings", "gluteus-maximus": "glutes", "gluteus-medius": "glutes", "gluteus-minimus": "glutes", "hip-flexors": "glutes", "medial-gastrocnemius": "calves", "lateral-gastrocnemius": "calves", "soleus": "calves"};
export function resolveAnatomyMuscleKey(name:string):string|null {
 const normalized=name.replace(/_/g," ").replace(/\.\d+$/,"");
 const slug=resolveAnatomyMeshToSlug(normalized);return slug?(GROUP_KEYS[slug]||slug):null;
}
