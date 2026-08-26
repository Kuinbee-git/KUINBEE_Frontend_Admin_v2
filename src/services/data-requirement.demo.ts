import type {
  DataRequirementDetail,
  DataRequirementListParams,
  DataRequirementPage,
  DataRequirementSource,
  DataRequirementStatus,
} from '@/types';

type DemoSeed = {
  id: string;
  referenceCode: string;
  title: string;
  source: DataRequirementSource;
  status: DataRequirementStatus;
  contactName: string;
  organization: string;
  industry: string;
  dataType: string;
  createdAt: string;
  summary: string;
};

const seeds: DemoSeed[] = [
  {
    id: 'demo-requirement-001',
    referenceCode: 'DEMO-001',
    title: 'Multilingual retail shelf image dataset',
    source: 'USER_APP',
    status: 'SUBMITTED',
    contactName: 'Demo Buyer',
    organization: 'Northstar Retail Labs',
    industry: 'Retail and e-commerce',
    dataType: 'Annotated images',
    createdAt: '2026-07-30T08:45:00.000Z',
    summary:
      'Shelf images from modern and traditional retail stores for product detection and planogram compliance.',
  },
  {
    id: 'demo-requirement-002',
    referenceCode: 'DEMO-002',
    title: 'Indian customer-support speech audio',
    source: 'SUPPLIER_PANEL',
    status: 'UNDER_REVIEW',
    contactName: 'Demo Supplier',
    organization: 'Vaani Data Studio',
    industry: 'Customer service',
    dataType: 'Conversational audio',
    createdAt: '2026-07-29T12:20:00.000Z',
    summary:
      'Consented customer-agent calls in Hindi, English, Marathi and Tamil with transcripts and speaker labels.',
  },
  {
    id: 'demo-requirement-003',
    referenceCode: 'DEMO-003',
    title: 'Property-level climate risk indicators',
    source: 'LEGACY_IMPORT',
    status: 'PUBLISHED',
    contactName: 'Kuinbee Preview Import',
    organization: 'Atlas Risk Research',
    industry: 'Insurance and real estate',
    dataType: 'Geospatial tabular data',
    createdAt: '2026-07-27T09:10:00.000Z',
    summary:
      'Property-level flood, heat, wildfire and water-stress indicators with transparent methodology.',
  },
  {
    id: 'demo-requirement-004',
    referenceCode: 'DEMO-004',
    title: 'Long-form medical dictation recordings',
    source: 'USER_APP',
    status: 'REJECTED',
    contactName: 'Demo Researcher',
    organization: 'Clinical AI Preview',
    industry: 'Healthcare',
    dataType: 'Speech audio',
    createdAt: '2026-07-25T16:30:00.000Z',
    summary:
      'Long-form clinical dictation audio with specialty metadata and verified commercial usage rights.',
  },
  {
    id: 'demo-requirement-005',
    referenceCode: 'DEMO-005',
    title: 'Urban traffic camera video collection',
    source: 'SUPPLIER_PANEL',
    status: 'CLOSED',
    contactName: 'Demo Operations Lead',
    organization: 'Transit Vision Works',
    industry: 'Transportation',
    dataType: 'Video',
    createdAt: '2026-07-22T11:05:00.000Z',
    summary:
      'Day and night traffic video covering intersections, arterial roads and mixed weather conditions.',
  },
  {
    id: 'demo-requirement-006',
    referenceCode: 'DEMO-006',
    title: 'Commercial contracts clause dataset',
    source: 'LEGACY_IMPORT',
    status: 'ARCHIVED',
    contactName: 'Kuinbee Preview Import',
    organization: 'Legal Data Preview',
    industry: 'Legal and compliance',
    dataType: 'Documents and annotations',
    createdAt: '2026-07-18T07:40:00.000Z',
    summary:
      'Commercial agreements annotated for clause type, obligations, governing law and renewal terms.',
  },
];

const statusTimestamp = (
  status: DataRequirementStatus,
  expected: DataRequirementStatus
) => (status === expected ? '2026-07-30T10:00:00.000Z' : null);

const toDetail = (seed: DemoSeed): DataRequirementDetail => {
  const reviewed = seed.status !== 'SUBMITTED';
  const published =
    seed.status === 'PUBLISHED' || seed.status === 'CLOSED' || seed.status === 'ARCHIVED';

  return {
    ...seed,
    version: reviewed ? 2 : 1,
    updatedAt: reviewed ? '2026-07-30T10:00:00.000Z' : seed.createdAt,
    slug: published
      ? seed.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      : null,
    contactEmail: 'preview.requirement@kuinbee.local',
    phone: '+00 00000 00000',
    description: `${seed.summary} The dataset should include documented collection methods, quality checks, provenance and licensing information.`,
    intendedUse:
      'Model training, evaluation and internal product research. The buyer requires commercial usage rights.',
    requestedFormats: ['CSV', 'JSON', 'Source media'],
    requestedGeographies: ['India', 'United Kingdom', 'United States'],
    requestedLanguages: ['English', 'Hindi'],
    expectedVolume: 'Approximately 50,000 labelled records',
    targetDeliveryDate: '2026-10-15T00:00:00.000Z',
    budgetRange: 'USD 25,000–50,000',
    licensingCompliance:
      'Commercial AI/ML usage, documented consent where applicable, and no public web-scraped content.',
    submitterNotes:
      'A representative sample and data dictionary would be helpful during evaluation.',
    originalSubmission: {
      preview: true,
      title: seed.title,
      source: seed.source,
      requestedFormats: ['CSV', 'JSON', 'Source media'],
    },
    supplierProfileId:
      seed.source === 'SUPPLIER_PANEL' ? `demo-supplier-${seed.id.slice(-3)}` : null,
    submittedByUserId:
      seed.source === 'LEGACY_IMPORT' ? null : `demo-user-${seed.id.slice(-3)}`,
    publicSummary: seed.summary,
    publicSpecifications: [
      'Clear provenance and commercial licensing required',
      'Quality report and representative sample required',
      'Personally identifiable information must be removed',
    ],
    publicCoverage: ['India', 'United Kingdom', 'United States'],
    publicVolume: ['50,000 labelled records', 'Pilot sample: 1,000 records'],
    publicDeliveryDate: '2026-10-15T00:00:00.000Z',
    adminNotes: 'Dummy preview record for reviewing the admin workflow and layout.',
    rejectionReason:
      seed.status === 'REJECTED'
        ? 'The submission did not include sufficient licensing evidence.'
        : null,
    reviewStartedAt: reviewed ? '2026-07-30T09:30:00.000Z' : null,
    publishedAt: published ? '2026-07-30T10:00:00.000Z' : null,
    rejectedAt: statusTimestamp(seed.status, 'REJECTED'),
    closedAt: statusTimestamp(seed.status, 'CLOSED'),
    archivedAt: statusTimestamp(seed.status, 'ARCHIVED'),
    events: [
      {
        id: `${seed.id}-submitted`,
        fromStatus: null,
        toStatus: 'SUBMITTED',
        action: 'SUBMITTED',
        note: 'Dummy requirement created for admin UI preview.',
        actorType: seed.source === 'SUPPLIER_PANEL' ? 'SUPPLIER' : 'USER',
        actorName: seed.contactName,
        actorEmail: 'preview.requirement@kuinbee.local',
        createdAt: seed.createdAt,
      },
      ...(reviewed
        ? [
            {
              id: `${seed.id}-reviewed`,
              fromStatus: 'SUBMITTED' as const,
              toStatus: seed.status,
              action: seed.status === 'UNDER_REVIEW' ? 'REVIEW_STARTED' : seed.status,
              note: 'Preview lifecycle event generated for the dummy record.',
              actorType: 'ADMIN' as const,
              actorName: 'Demo Administrator',
              actorEmail: 'preview.admin@kuinbee.local',
              createdAt: '2026-07-30T10:00:00.000Z',
            },
          ]
        : []),
    ],
  };
};

export const demoDataRequirements = seeds.map(toDetail);

export const isDemoDataRequirement = (requirementId: string) =>
  requirementId.startsWith('demo-requirement-');

export function getDemoDataRequirement(requirementId: string) {
  return demoDataRequirements.find((requirement) => requirement.id === requirementId);
}

export function listDemoDataRequirements(
  params: DataRequirementListParams
): DataRequirementPage {
  const q = params.q?.trim().toLowerCase();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const items = demoDataRequirements
    .filter(
      (item) =>
        (!params.status || item.status === params.status) &&
        (!params.source || item.source === params.source) &&
        (!q ||
          [
            item.title,
            item.referenceCode,
            item.contactName,
            item.contactEmail,
            item.organization,
          ].some((value) => (value ?? '').toLowerCase().includes(q)))
    )
    .sort((left, right) => {
      if (params.sort === 'OLDEST') return left.createdAt.localeCompare(right.createdAt);
      if (params.sort === 'UPDATED') return right.updatedAt.localeCompare(left.updatedAt);
      return right.createdAt.localeCompare(left.createdAt);
    });
  const total = items.length;

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
