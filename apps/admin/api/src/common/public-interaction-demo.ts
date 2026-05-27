export const demoPublicPosts = [
  {
    id: 'post-project-data-center-cabling',
    type: 'PROJECT',
    title: 'Data center cabling package',
    description:
      'Cable technicians, rack installers, weak-current electricians, and QA supervisors for a live Frankfurt delivery package.',
    domain: 'Data Center / Low Voltage / ICT',
    location: 'Germany · Frankfurt',
    status: 'LIVE',
    value: 'EUR 420,000 gross project',
    ownerName: 'NordGrid Data Infrastructure GmbH',
    ownerType: 'Contractor',
    classificationJson: {
      standards:
        'ESCO: ICT cabling technician · NACE: J62/J63 · Uniclass: Communications systems',
    },
    certifications: 'Working at height, MEWP, fiber optics, HSE, low voltage',
    visibility: 'PUBLIC',
    createdAt: '2026-04-25T09:00:00.000Z',
    updatedAt: '2026-04-29T12:00:00.000Z',
    media: [
      {
        id: 'media-project-data-center-cabling',
        postId: 'post-project-data-center-cabling',
        url: 'https://cdn.openstaff.local/demo/data-center-cabling.jpg',
        type: 'IMAGE',
        alt: 'Data center racks and cable trays',
        status: 'APPROVED',
        createdAt: '2026-04-25T09:15:00.000Z',
        updatedAt: '2026-04-25T09:15:00.000Z',
      },
    ],
    externalLinks: [
      {
        id: 'link-project-data-center-cabling',
        url: 'https://nordgrid.example.com/project/data-center-cabling',
        normalizedUrl:
          'https://nordgrid.example.com/project/data-center-cabling',
        sourcePostId: 'post-project-data-center-cabling',
        submittedBy: 'NordGrid Data Infrastructure GmbH',
        securityStatus: 'APPROVED',
        reasonsJson: [
          'HTTPS detected',
          'No blocked extension',
          'No suspicious terms found',
        ],
        createdAt: '2026-04-25T09:20:00.000Z',
        updatedAt: '2026-04-25T09:20:00.000Z',
      },
    ],
    privateConversations: [
      {
        id: 'conversation-project-data-center-cabling',
        postId: 'post-project-data-center-cabling',
        requesterName: 'Approved OpenStaff User',
        ownerName: 'NordGrid Data Infrastructure GmbH',
        status: 'OPEN',
        createdAt: '2026-04-28T10:00:00.000Z',
        updatedAt: '2026-04-29T09:30:00.000Z',
        messages: [
          {
            id: 'message-project-data-center-cabling-1',
            conversationId: 'conversation-project-data-center-cabling',
            senderName: 'Approved OpenStaff User',
            message:
              'We can field a structured cabling team with QA cover and fiber optics certification.',
            status: 'SENT',
            createdAt: '2026-04-28T10:00:00.000Z',
            updatedAt: '2026-04-28T10:00:00.000Z',
          },
        ],
      },
    ],
    comments: [
      {
        id: 'comment-project-data-center-cabling',
        postId: 'post-project-data-center-cabling',
        authorName: 'Field Operations Viewer',
        comment:
          'Can you confirm whether night shifts are included in this package?',
        status: 'PUBLISHED',
        createdAt: '2026-04-28T14:00:00.000Z',
        updatedAt: '2026-04-28T14:00:00.000Z',
      },
    ],
    reviews: [
      {
        id: 'review-project-data-center-cabling',
        postId: 'post-project-data-center-cabling',
        authorName: 'Verified Contractor Partner',
        rating: 5,
        review:
          'Clear scope and strong technical classification. Good example of a structured public listing.',
        status: 'PUBLISHED',
        createdAt: '2026-04-29T08:00:00.000Z',
        updatedAt: '2026-04-29T08:00:00.000Z',
      },
    ],
  },
  {
    id: 'post-professional-cabling-team',
    type: 'PROFESSIONAL',
    title: 'Data center cabling team',
    description:
      'Structured cabling, racks, patch panels, labeling, and test documentation for critical infrastructure delivery.',
    domain: 'Data Center / ICT',
    location: 'Czech Republic',
    status: 'AVAILABLE',
    value: 'Minimum contract: EUR 85,000 gross',
    ownerName: 'Central Europe Cabling Team',
    ownerType: 'Subcontracting Pool',
    classificationJson: {
      standards:
        'ESCO: ICT installer · NACE: J62/J63 · Uniclass: Communications systems',
    },
    certifications: 'Fiber optics, low voltage, working at height',
    visibility: 'PUBLIC',
    createdAt: '2026-04-26T11:00:00.000Z',
    updatedAt: '2026-04-29T13:00:00.000Z',
    media: [
      {
        id: 'media-professional-cabling-team',
        postId: 'post-professional-cabling-team',
        url: 'https://cdn.openstaff.local/demo/cabling-team.mp4',
        type: 'VIDEO',
        alt: 'Cabling team portfolio reel',
        status: 'PENDING',
        createdAt: '2026-04-26T11:05:00.000Z',
        updatedAt: '2026-04-29T13:00:00.000Z',
      },
    ],
    externalLinks: [
      {
        id: 'link-professional-cabling-team',
        url: 'http://central-europe-cabling.example.com/portfolio',
        normalizedUrl: 'http://central-europe-cabling.example.com/portfolio',
        sourcePostId: 'post-professional-cabling-team',
        submittedBy: 'Central Europe Cabling Team',
        securityStatus: 'PENDING',
        reasonsJson: ['HTTP link detected. HTTPS is recommended.'],
        createdAt: '2026-04-27T09:00:00.000Z',
        updatedAt: '2026-04-27T09:00:00.000Z',
      },
    ],
    privateConversations: [
      {
        id: 'conversation-professional-cabling-team',
        postId: 'post-professional-cabling-team',
        requesterName: 'Approved OpenStaff User',
        ownerName: 'Central Europe Cabling Team',
        status: 'FLAGGED',
        createdAt: '2026-04-29T07:30:00.000Z',
        updatedAt: '2026-04-29T08:00:00.000Z',
        messages: [
          {
            id: 'message-professional-cabling-team-1',
            conversationId: 'conversation-professional-cabling-team',
            senderName: 'Central Europe Cabling Team',
            message:
              'Please share your exact site access and rotation requirements.',
            status: 'PENDING_REVIEW',
            createdAt: '2026-04-29T07:45:00.000Z',
            updatedAt: '2026-04-29T07:45:00.000Z',
          },
        ],
      },
    ],
    comments: [
      {
        id: 'comment-professional-cabling-team',
        postId: 'post-professional-cabling-team',
        authorName: 'Marketplace Visitor',
        comment: 'Is this team available for Benelux mobilisation in May?',
        status: 'PENDING_REVIEW',
        createdAt: '2026-04-29T09:00:00.000Z',
        updatedAt: '2026-04-29T09:00:00.000Z',
      },
    ],
    reviews: [
      {
        id: 'review-professional-cabling-team',
        postId: 'post-professional-cabling-team',
        authorName: 'Project Delivery Lead',
        rating: 4,
        review:
          'Strong credentials, pending link verification before publishing broader outreach.',
        status: 'PENDING_REVIEW',
        createdAt: '2026-04-29T10:30:00.000Z',
        updatedAt: '2026-04-29T10:30:00.000Z',
      },
    ],
  },
];

export const demoPublicPostMedia = demoPublicPosts.flatMap(
  (post) => post.media,
);
export const demoExternalLinkSubmissions = demoPublicPosts.flatMap(
  (post) => post.externalLinks,
);
export const demoPrivateConversations = demoPublicPosts.flatMap(
  (post) => post.privateConversations,
);
export const demoPrivateMessages = demoPrivateConversations.flatMap(
  (conversation) => conversation.messages,
);
export const demoPublicComments = demoPublicPosts.flatMap(
  (post) => post.comments,
);
export const demoPublicReviews = demoPublicPosts.flatMap(
  (post) => post.reviews,
);

export function cloneDemoPublicPosts() {
  return JSON.parse(JSON.stringify(demoPublicPosts));
}

export function cloneDemoExternalLinks() {
  return JSON.parse(JSON.stringify(demoExternalLinkSubmissions));
}

export function cloneDemoPrivateConversations() {
  return JSON.parse(JSON.stringify(demoPrivateConversations));
}

export function cloneDemoPublicComments() {
  return JSON.parse(JSON.stringify(demoPublicComments));
}

export function cloneDemoPublicReviews() {
  return JSON.parse(JSON.stringify(demoPublicReviews));
}
