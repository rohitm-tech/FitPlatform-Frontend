import * as THREE from 'three';

/**
 * Natural human skin-tone materials. Chest regions use distinct tints so
 * upper / middle / lower chest stay visually segregated.
 */

function skinMat(
  hex: string,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {},
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness: 0.48,
    metalness: 0.0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.4,
    sheen: 0.35,
    sheenColor: new THREE.Color('#f0d5c4'),
    sheenRoughness: 0.55,
    specularIntensity: 0.55,
    specularColor: new THREE.Color('#ffe8dc'),
    ...opts,
  });
}

export const boneMaterial = skinMat('#e5d5c5', {
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
  clearcoat: 0.08,
});

export const tendonMaterial = skinMat('#e8d8c8', { roughness: 0.42, clearcoat: 0.3 });

export const cartilageMaterial = skinMat('#dcc8b4', {
  roughness: 0.5,
  transparent: true,
  opacity: 0.8,
});

/** Default body skin */
export const muscleDefault = skinMat('#c99578');

export const muscleHover = skinMat('#e0b090', {
  emissive: new THREE.Color('#5a3a28'),
  emissiveIntensity: 0.28,
  roughness: 0.38,
  clearcoat: 0.45,
});

export const muscleSelected = skinMat('#52e0b5', {
  emissive: new THREE.Color('#17644b'),
  emissiveIntensity: 0.42,
  roughness: 0.32,
  clearcoat: 0.55,
});

/** Hovered / selected muscle drawn on top of the skin (x-ray view). */
function xrayMat(hex: string, glowHex: string, opacity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    emissive: new THREE.Color(glowHex),
    emissiveIntensity: 0.7,
    roughness: 0.45,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
}

export const muscleHoverXray = xrayMat('#e2584a', '#7a1a12', 0.6);
export const muscleSelectedXray = xrayMat('#52e0b5', '#17644b', 0.85);

export const fillerMaterial =skinMat('#b8957a', {
  transparent: true,
  opacity: 0.45,
  roughness: 0.55,
});

/** Chest region defaults — slight shade steps for clear segregation */
export const chestUpperMaterial = skinMat('#d4a888'); // lighter (clavicular)
export const chestMiddleMaterial = skinMat('#c28a6a'); // mid (sternocostal)
export const chestLowerMaterial = skinMat('#b07858'); // deeper (abdominal)
export const chestInnerMaterial = skinMat('#c99878'); // minor

const CHEST_DEFAULTS: Record<string, THREE.MeshPhysicalMaterial> = {
  'upper-chest': chestUpperMaterial,
  'middle-chest': chestMiddleMaterial,
  'lower-chest': chestLowerMaterial,
  'inner-chest': chestInnerMaterial,
};

export type AnatomyKind = 'muscle' | 'bone' | 'tendon' | 'cartilage' | 'filler';

export function classifyAnatomyPart(name: string): AnatomyKind {
  if (!name) return 'filler';
  if (/bone|vertebra|skull|rib|femur|tibia|fibula|humerus|radius|ulna|carpal|tarsal|phalange|ilium|ischium|pubis|scapula|clavicle|sternum|patella|mandible|maxilla|occipital|temporal|parietal|frontal|sacrum|coccyx|calcaneus|talus|metacarpal|metatarsal/i.test(name)) {
    return 'bone';
  }
  if (/tendon|ligament|aponeurosis|retinaculum/i.test(name)) {
    return 'tendon';
  }
  if (/cartilage|disc|meniscus|labrum/i.test(name)) {
    return 'cartilage';
  }
  if (/bursa|fossa|tubercle|tuberosity|facet|notch|crest|canal |process|symphysis|epiphysis|nerve|artery|vein|skin|fat/i.test(name)) {
    return 'filler';
  }
  if (/muscle|deltoid|pectoralis|trapezius|latissimus|rhomboid|oblique|abdominis|gluteus|vastus|gastrocnemius|soleus|biceps|triceps|brachialis|brachioradialis|femoris|semitendinosus|semimembranosus|serratus|infraspinatus|teres|iliopsoas|iliacus|psoas|adductor|pectineus|gracilis|flexor|extensor|supinator|pronator|anconeus|coracobrachialis|pyramidalis|transversus/i.test(name)) {
    return 'muscle';
  }
  return 'filler';
}

export function materialForKind(kind: AnatomyKind): THREE.MeshPhysicalMaterial {
  switch (kind) {
    case 'muscle':
      return muscleDefault;
    case 'bone':
      return boneMaterial;
    case 'tendon':
      return tendonMaterial;
    case 'cartilage':
      return cartilageMaterial;
    default:
      return fillerMaterial;
  }
}

/** Default material for a mapped muscle slug (chest gets region tints). */
export function materialForSlug(slug: string | null, kind: AnatomyKind): THREE.MeshPhysicalMaterial {
  if (slug && CHEST_DEFAULTS[slug]) return CHEST_DEFAULTS[slug];
  return materialForKind(kind);
}
