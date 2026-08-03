import type { ChapterId } from './journey';

/**
 * All copy lives here.
 *
 * Editorial rule, enforced deliberately: capabilities only. No invented
 * statistics, client names, certifications, awards, project values, years of
 * experience, office locations or completed-project counts appear anywhere in
 * this file. Every line describes what the group *does*, never what it claims
 * to have done.
 */

export const BRAND = {
  name: 'DRS GLOBAL',
  positioning: 'A Multi-Sector Engineering & Business Solutions Group',
  tagline: 'Engineering Industries. Connecting Markets. Enabling Growth.',
  closing: 'One Group. Infinite Possibilities.',
};

export interface ChapterCopy {
  id: ChapterId;
  /** Mono overline. */
  eyebrow?: string;
  /** Display headline. */
  title?: string;
  /** Supporting line. */
  body?: string;
  services?: string[];
}

export const COPY: Record<ChapterId, ChapterCopy> = {
  forge: {
    id: 'forge',
    eyebrow: 'Multi-Sector Engineering & Business Solutions',
    title: 'DRS GLOBAL',
    body: 'Engineering Industries. Connecting Markets. Enabling Growth.',
  },

  descent: {
    id: 'descent',
    eyebrow: 'Beneath every industry',
    title: 'Infrastructure begins\nbelow the surface.',
    body: 'What the world sees as finished capability begins as engineering intent.',
  },

  blueprint: {
    id: 'blueprint',
    eyebrow: 'The Master Plan',
    title: 'Every capability\nstarts as a drawing.',
    body: 'Ports. Plants. Power. Networks. Before anything is built, it is engineered — sequenced, specified and resolved. What follows is that plan, realised.',
  },

  digital: {
    id: 'digital',
    eyebrow: 'Division IV',
    title: 'Digital\nTransformation',
    body: 'Systems, platforms and digital infrastructure that let industrial businesses operate, measure and scale with precision.',
    services: [
      'Website Development',
      'Custom Web Applications',
      'SEO Optimization',
      'Search Marketing',
      'Social Media Management',
      'Brand Identity',
      'Content Creation',
      'Digital Advertising',
      'UI / UX Design',
      'Automation',
      'CRM Solutions',
      'AI Integration',
      'Analytics',
    ],
  },

  industrial: {
    id: 'industrial',
    eyebrow: 'Division V',
    title: 'Industrial\nSolutions',
    body: 'Heavy mechanical capability across fabrication, installation and the disciplined maintenance that keeps production running.',
    services: [
      'Industrial Robotics',
      'Material Handling Systems',
      'Automated Conveyors',
      'Heavy Machinery',
      'Steel Fabrication',
      'Machine Foundations',
      'Mechanical Installations',
      'Preventive Maintenance',
      'Shutdown Services',
    ],
  },

  construction: {
    id: 'construction',
    eyebrow: 'Division VI',
    title: 'Construction',
    body: 'Materials, procurement and turnkey support for industrial and commercial construction programmes.',
    services: [
      'Construction Materials Supply',
      'Steel Supply',
      'Iron Rod Supply',
      'Cement Supply',
      'Aggregate Supply',
      'Industrial Construction Support',
      'Procurement Solutions',
      'Turnkey Project Support',
    ],
  },

  logistics: {
    id: 'logistics',
    eyebrow: 'Division VII',
    title: 'Logistics',
    body: 'Movement across borders — documented, cleared, warehoused and delivered as one controlled chain.',
    services: [
      'Customs Clearance',
      'Import Documentation',
      'Export Documentation',
      'Heavy Lift Logistics',
      'Freight Forwarding',
      'Warehousing',
      'Supply Chain Management',
    ],
  },

  energy: {
    id: 'energy',
    eyebrow: 'Division VIII',
    title: 'Renewable\nEnergy',
    body: 'Generation, storage and distribution engineered as a single system — from array to substation to load.',
    services: [
      'Solar EPC',
      'Commercial Solar',
      'Ground Mounted Solar',
      'Battery Energy Storage',
      'Energy Audits',
      'Hybrid Power Systems',
      'EV Charging Infrastructure',
      'Electrical Infrastructure',
      'Power Distribution',
      'Energy Management Systems',
    ],
  },

  engineering: {
    id: 'engineering',
    eyebrow: 'Division IX',
    title: 'Engineering',
    body: 'The discipline beneath every other division — specified, installed, tested and commissioned.',
    services: [
      'Electrical Engineering',
      'Industrial Engineering',
      'Equipment Installation',
      'Industrial Equipment Installation',
      'Testing & Commissioning',
      'Control Systems',
      'Technical Consulting',
      'Project Engineering',
      'Maintenance',
      'Operations Support',
    ],
  },

  ascent: {
    id: 'ascent',
    eyebrow: 'DRS GLOBAL',
    title: 'One Group.\nInfinite Possibilities.',
    body: 'Six divisions, engineered to operate as one. Integrated capability across the systems industry depends on.',
  },
};

/**
 * The closing chapter plays as three beats, not one panel.
 *
 * It occupies 13 % of the journey — roughly two screens of scrolling — which is
 * far too much room for a single static layout to hold, and far too little to
 * cram the brand close, the company statement and the contact details into one
 * frame. Sequencing them lets the ending breathe and gives the last stretch of
 * scroll something to reveal:
 *
 *   1. One Group. Infinite Possibilities.  — the brand close
 *   2. About DRS Global                    — who the group is
 *   3. Let's Build Something Extraordinary — the ask, and how to reach them
 */
export const ABOUT = {
  eyebrow: 'About DRS Global',
  title: 'One partner across\nevery function.',
  body: 'DRS Global is a multi-sector engineering and business solutions group delivering integrated services across engineering, industrial infrastructure, logistics, renewable energy, construction supply chains and digital transformation.',
  body2:
    'Our multidisciplinary approach enables organizations to work with one trusted partner across multiple business functions — from concept and procurement to installation, commissioning, logistics and digital growth.',
};

export const CONTACT = {
  email: 'admin@drsglobal.info',
  domain: 'drsglobal.info',
  domainHref: 'https://drsglobal.info',
  founders: [
    { name: 'Rahul', display: '+91 80728 22140', tel: '+918072822140' },
    { name: 'Shabarish', display: '+91 93444 16928', tel: '+919344416928' },
  ],
};

/**
 * Every action resolves to a real destination.
 *
 * These previously all pointed at `#contact`, an anchor with nothing behind it —
 * four controls that looked like the primary conversion path and did nothing
 * when clicked. `mailto:` and `tel:` work without JavaScript, open the right app
 * on mobile, and carry a subject line so an enquiry arrives already labelled.
 */
export const CTA = {
  headline: "Let's Build Something Extraordinary.",
  intro:
    "Whether you're planning your next engineering project, expanding industrial operations, deploying renewable energy, optimizing logistics or accelerating your digital presence, DRS Global is ready to help.",
  prompt: 'Get in touch today.',
  /*
    Two buttons, not four.

    Four pill controls of similar weight wrapped into an arbitrary 2-and-2 block
    and gave the eye nothing to land on — every option looked equally important,
    which is the same as none of them being important. The two written actions
    stay as buttons; calling is served by the numbers themselves in the contact
    column, where a phone number belongs.
  */
  actions: [
    {
      label: 'Schedule a Consultation',
      href: `mailto:${CONTACT.email}?subject=${encodeURIComponent('Consultation request')}`,
      primary: true,
    },
    {
      label: 'Request a Quote',
      href: `mailto:${CONTACT.email}?subject=${encodeURIComponent('Quote request')}`,
      primary: false,
    },
  ],
};

/**
 * Optional cinematic video layer.
 *
 * The world renders in real time and is complete without any of this. But if
 * clips are produced (Google Flow / Veo, or any other tool), dropping an MP4
 * into /public/video/ and setting `src` here composites it into the journey at
 * the given t-range — no code changes required.
 *
 * `blend` controls how the clip sits against the live world:
 *   'screen'  — additive; good for light, fire, energy, holograms
 *   'normal'  — full-frame takeover; good for a hero plate
 *
 * Leave `src: null` to keep a slot purely real-time.
 */
export interface VideoCue {
  id: string;
  src: string | null;
  start: number;
  end: number;
  blend: 'screen' | 'normal';
  /** Peak opacity at the centre of the range. */
  peak: number;
  note: string;
}

/**
 * Ranges deliberately overlap their neighbours by ~0.02. Combined with the
 * plateau ramp in VideoLayer, that overlap is what crossfades one plate into
 * the next — abutting ranges would dip to black at every seam.
 */
export const VIDEO_CUES: VideoCue[] = [
  {
    id: 'forge-plate',
    src: '/video/forge-plate.mp4',
    start: 0.0,
    end: 0.115,
    blend: 'screen',
    peak: 1,
    note: 'I — Molten steel fragments assembling in darkness. Opens the film.',
  },
  {
    id: 'descent-fracture',
    src: '/video/descent-fracture.mp4',
    start: 0.075,
    end: 0.17,
    blend: 'screen',
    peak: 1,
    note: 'II — Falling through a molten fracture. Camera plunges downward.',
  },
  {
    id: 'blueprint-grid',
    src: '/video/blueprint-grid.mp4',
    start: 0.145,
    end: 0.29,
    blend: 'screen',
    peak: 1,
    note: 'III — Cyan wireframe drawing itself. Forward travel, slight rise.',
  },
  {
    id: 'digital-city',
    src: '/video/digital-city.mp4',
    start: 0.265,
    end: 0.39,
    blend: 'screen',
    peak: 1,
    note: 'IV — Holographic data light. Forward, rising, drifting left.',
  },
  {
    id: 'industrial-heat',
    src: '/video/industrial-heat.mp4',
    start: 0.37,
    end: 0.485,
    blend: 'screen',
    peak: 1,
    note: 'V — Foundry sparks and furnace glow.',
  },
  {
    id: 'construction-rise',
    src: '/video/construction-rise.mp4',
    start: 0.46,
    end: 0.58,
    blend: 'screen',
    peak: 1,
    note: 'VI — Concrete dust and low sun. Forward and climbing.',
  },
  {
    id: 'logistics-port',
    src: '/video/logistics-port.mp4',
    start: 0.555,
    end: 0.675,
    blend: 'screen',
    peak: 1,
    note: 'VII — Cold dawn fog over a container terminal. Forward, descending, drifting left.',
  },
  {
    id: 'energy-goldenhour',
    src: '/video/energy-goldenhour.mp4',
    start: 0.65,
    end: 0.775,
    blend: 'screen',
    peak: 1,
    note: 'VIII — Golden hour flare across a solar array.',
  },
  {
    id: 'engineering-tunnel',
    src: '/video/engineering-tunnel.mp4',
    start: 0.75,
    end: 0.885,
    blend: 'screen',
    peak: 1,
    note: 'IX — Underground service tunnel, cyan indicators. Forward, descending, drifting left.',
  },
  {
    id: 'ascent-sky',
    src: '/video/ascent-sky.mp4',
    start: 0.865,
    end: 1.0,
    blend: 'screen',
    peak: 1,
    note: 'X — Sunrise cloud deck from altitude. Ends the film.',
  },
];
