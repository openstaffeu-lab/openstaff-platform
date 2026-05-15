import { ApiError, apiRequest, getApiUrl } from "./api";

export type PublicFeedKind = "project" | "professional";
export type PublicPostType = "PROJECT" | "PROFESSIONAL" | "SUBCONTRACTOR_POOL";
export type MediaType = "IMAGE" | "VIDEO";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ConversationStatus = "OPEN" | "CLOSED" | "FLAGGED";
export type MessageStatus = "SENT" | "PENDING_REVIEW" | "FLAGGED";
export type FeedbackStatus = "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";

export type PublicPostMedia = {
  id: string;
  postId: string;
  url: string;
  type: MediaType;
  alt: string;
  status: ModerationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExternalLinkSubmission = {
  id: string;
  url: string;
  normalizedUrl: string;
  sourcePostId: string;
  submittedBy: string;
  securityStatus: "PENDING" | "APPROVED" | "REJECTED";
  reasonsJson: string[];
  createdAt: string;
  updatedAt: string;
};

export type PrivateMessage = {
  id: string;
  conversationId: string;
  senderName: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type PrivateConversation = {
  id: string;
  postId: string;
  requesterName: string;
  ownerName: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: PrivateMessage[];
};

export type PublicComment = {
  id: string;
  postId: string;
  authorName: string;
  comment: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
};

export type PublicReview = {
  id: string;
  postId: string;
  authorName: string;
  rating: number | null;
  review: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
};

export type PublicPostRecord = {
  id: string;
  type: PublicPostType;
  title: string;
  description: string;
  domain: string;
  location: string;
  status: string;
  value: string;
  ownerName: string;
  ownerType: string;
  classificationJson: {
    standards?: string;
  } & Record<string, unknown>;
  certifications: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  media: PublicPostMedia[];
  externalLinks: ExternalLinkSubmission[];
  privateConversations: PrivateConversation[];
  comments: PublicComment[];
  reviews: PublicReview[];
};

export type PublicFeedItem = {
  id: string;
  type: PublicFeedKind;
  ownerName: string;
  ownerType: string;
  title: string;
  location: string;
  domain: string;
  status: string;
  value: string;
  description: string;
  standards: string;
  certifications: string;
  media?: string;
  verified?: boolean;
};

export type StructuredResult<T> = {
  ok: boolean;
  data: T;
  source: "api" | "fallback";
  message?: string;
};

type CreateConversationInput = {
  postId: string;
  requesterName: string;
  ownerName: string;
};

type CreateMessageInput = {
  senderName: string;
  message: string;
};

type CreateCommentInput = {
  authorName: string;
  comment: string;
};

type CreateReviewInput = {
  authorName: string;
  review: string;
  rating?: number | null;
};

const LOCAL_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.openstaff.eu"
    : "http://localhost:8080");

const demoPublicPosts: PublicPostRecord[] = [
  {
    id: "post-project-data-center-cabling",
    type: "PROJECT",
    title: "Data center cabling package",
    description:
      "Cable technicians, rack installers, weak-current electricians, QA supervisor.",
    domain: "Data Center / Low Voltage / ICT",
    location: "Germany - Frankfurt",
    status: "Live",
    value: "EUR 420,000 gross project",
    ownerName: "NordGrid Data Infrastructure GmbH",
    ownerType: "Contractor",
    classificationJson: {
      standards:
        "ESCO: ICT cabling technician - NACE: J62/J63 - Uniclass: Communications systems",
    },
    certifications: "Working at height, MEWP, fiber optics, HSE, low voltage",
    visibility: "PUBLIC",
    createdAt: "2026-04-25T09:00:00.000Z",
    updatedAt: "2026-04-29T12:00:00.000Z",
    media: [
      {
        id: "media-project-data-center-cabling",
        postId: "post-project-data-center-cabling",
        url: "https://cdn.openstaff.local/demo/data-center-cabling.jpg",
        type: "IMAGE",
        alt: "Data center racks, cable trays and structured cabling mockup",
        status: "APPROVED",
        createdAt: "2026-04-25T09:15:00.000Z",
        updatedAt: "2026-04-25T09:15:00.000Z",
      },
    ],
    externalLinks: [
      {
        id: "link-project-data-center-cabling",
        url: "https://nordgrid.example.com/project/data-center-cabling",
        normalizedUrl: "https://nordgrid.example.com/project/data-center-cabling",
        sourcePostId: "post-project-data-center-cabling",
        submittedBy: "NordGrid Data Infrastructure GmbH",
        securityStatus: "APPROVED",
        reasonsJson: ["HTTPS detected", "No blocked extension", "No suspicious terms found"],
        createdAt: "2026-04-25T09:20:00.000Z",
        updatedAt: "2026-04-25T09:20:00.000Z",
      },
    ],
    privateConversations: [
      {
        id: "conversation-project-data-center-cabling",
        postId: "post-project-data-center-cabling",
        requesterName: "Approved OpenStaff User",
        ownerName: "NordGrid Data Infrastructure GmbH",
        status: "OPEN",
        createdAt: "2026-04-28T10:00:00.000Z",
        updatedAt: "2026-04-29T09:30:00.000Z",
        messages: [
          {
            id: "message-project-data-center-cabling-1",
            conversationId: "conversation-project-data-center-cabling",
            senderName: "Approved OpenStaff User",
            message:
              "We can field a structured cabling team with QA cover and fiber optics certification.",
            status: "SENT",
            createdAt: "2026-04-28T10:00:00.000Z",
            updatedAt: "2026-04-28T10:00:00.000Z",
          },
        ],
      },
    ],
    comments: [
      {
        id: "comment-project-data-center-cabling",
        postId: "post-project-data-center-cabling",
        authorName: "Field Operations Viewer",
        comment: "Can you confirm whether night shifts are included in this package?",
        status: "PUBLISHED",
        createdAt: "2026-04-28T14:00:00.000Z",
        updatedAt: "2026-04-28T14:00:00.000Z",
      },
    ],
    reviews: [
      {
        id: "review-project-data-center-cabling",
        postId: "post-project-data-center-cabling",
        authorName: "Verified Contractor Partner",
        rating: 5,
        review:
          "Clear scope and strong technical classification. Good example of a structured public listing.",
        status: "PUBLISHED",
        createdAt: "2026-04-29T08:00:00.000Z",
        updatedAt: "2026-04-29T08:00:00.000Z",
      },
    ],
  },
  {
    id: "post-project-electrical-panels",
    type: "PROJECT",
    title: "Data center electrical supports and panels",
    description:
      "Electricians, mechanical locksmiths, support installers, project supervisor.",
    domain: "Data Center / Electrical / Mechanical Supports",
    location: "Netherlands - Amsterdam",
    status: "Pending",
    value: "EUR 610,000 gross project",
    ownerName: "Benelux Critical Facilities B.V.",
    ownerType: "General Contractor",
    classificationJson: {
      standards:
        "ESCO: Electrician - NACE: F43 - Uniclass: Electrical power systems",
    },
    certifications: "Low voltage, high voltage, working at height, technical drawings",
    visibility: "PUBLIC",
    createdAt: "2026-04-24T11:00:00.000Z",
    updatedAt: "2026-04-28T15:00:00.000Z",
    media: [],
    externalLinks: [],
    privateConversations: [],
    comments: [],
    reviews: [],
  },
  {
    id: "post-project-photovoltaic",
    type: "PROJECT",
    title: "Photovoltaic park installation",
    description: "PV installers, electricians, working-at-height certified teams.",
    domain: "Energy / Photovoltaic Panels",
    location: "Spain - Valencia",
    status: "Live",
    value: "EUR 310,000 gross project",
    ownerName: "Iberia Solar Works S.L.",
    ownerType: "Energy Contractor",
    classificationJson: {
      standards:
        "ESCO: Solar photovoltaic installer - NACE: D35/F43 - Uniclass: Energy systems",
    },
    certifications: "Working at height, MEWP, certified electricians",
    visibility: "PUBLIC",
    createdAt: "2026-04-23T11:00:00.000Z",
    updatedAt: "2026-04-28T14:00:00.000Z",
    media: [
      {
        id: "media-project-photovoltaic",
        postId: "post-project-photovoltaic",
        url: "https://cdn.openstaff.local/demo/photovoltaic.jpg",
        type: "IMAGE",
        alt: "Photovoltaic field installation progress",
        status: "APPROVED",
        createdAt: "2026-04-23T11:10:00.000Z",
        updatedAt: "2026-04-23T11:10:00.000Z",
      },
    ],
    externalLinks: [],
    privateConversations: [],
    comments: [],
    reviews: [],
  },
  {
    id: "post-professional-cabling-team",
    type: "PROFESSIONAL",
    title: "Data center cabling team",
    description: "Structured cabling, racks, patch panels, labeling, testing.",
    domain: "Data Center / ICT",
    location: "Czech Republic",
    status: "Available",
    value: "Minimum contract: EUR 85,000 gross",
    ownerName: "Central Europe Cabling Team",
    ownerType: "Subcontracting Pool",
    classificationJson: {
      standards:
        "ESCO: ICT installer - NACE: J62/J63 - Uniclass: Communications systems",
    },
    certifications: "Fiber optics, low voltage, working at height",
    visibility: "PUBLIC",
    createdAt: "2026-04-26T11:00:00.000Z",
    updatedAt: "2026-04-29T13:00:00.000Z",
    media: [
      {
        id: "media-professional-cabling-team",
        postId: "post-professional-cabling-team",
        url: "https://cdn.openstaff.local/demo/cabling-team.mp4",
        type: "VIDEO",
        alt: "Cabling team portfolio reel",
        status: "PENDING",
        createdAt: "2026-04-26T11:05:00.000Z",
        updatedAt: "2026-04-29T13:00:00.000Z",
      },
    ],
    externalLinks: [
      {
        id: "link-professional-cabling-team",
        url: "http://central-europe-cabling.example.com/portfolio",
        normalizedUrl: "http://central-europe-cabling.example.com/portfolio",
        sourcePostId: "post-professional-cabling-team",
        submittedBy: "Central Europe Cabling Team",
        securityStatus: "PENDING",
        reasonsJson: ["HTTP link detected. HTTPS is recommended."],
        createdAt: "2026-04-27T09:00:00.000Z",
        updatedAt: "2026-04-27T09:00:00.000Z",
      },
    ],
    privateConversations: [
      {
        id: "conversation-professional-cabling-team",
        postId: "post-professional-cabling-team",
        requesterName: "Approved OpenStaff User",
        ownerName: "Central Europe Cabling Team",
        status: "FLAGGED",
        createdAt: "2026-04-29T07:30:00.000Z",
        updatedAt: "2026-04-29T08:00:00.000Z",
        messages: [
          {
            id: "message-professional-cabling-team-1",
            conversationId: "conversation-professional-cabling-team",
            senderName: "Central Europe Cabling Team",
            message: "Please share your exact site access and rotation requirements.",
            status: "PENDING_REVIEW",
            createdAt: "2026-04-29T07:45:00.000Z",
            updatedAt: "2026-04-29T07:45:00.000Z",
          },
        ],
      },
    ],
    comments: [
      {
        id: "comment-professional-cabling-team",
        postId: "post-professional-cabling-team",
        authorName: "Marketplace Visitor",
        comment: "Is this team available for Benelux mobilisation in May?",
        status: "PENDING_REVIEW",
        createdAt: "2026-04-29T09:00:00.000Z",
        updatedAt: "2026-04-29T09:00:00.000Z",
      },
    ],
    reviews: [
      {
        id: "review-professional-cabling-team",
        postId: "post-professional-cabling-team",
        authorName: "Project Delivery Lead",
        rating: 4,
        review: "Strong credentials, pending link verification before publishing broader outreach.",
        status: "PENDING_REVIEW",
        createdAt: "2026-04-29T10:30:00.000Z",
        updatedAt: "2026-04-29T10:30:00.000Z",
      },
    ],
  },
  {
    id: "post-professional-electrical-team",
    type: "SUBCONTRACTOR_POOL",
    title: "Electrical subcontractor team",
    description: "Industrial electrical works, panels, cable trays.",
    domain: "Construction / Electrical",
    location: "Romania",
    status: "Available",
    value: "Minimum contract: EUR 45,000 gross",
    ownerName: "RO Industrial Electrical Team",
    ownerType: "Subcontractor",
    classificationJson: {
      standards: "ESCO: Electrician - NACE: F43 - Uniclass: Electrical systems",
    },
    certifications: "Live electrical work, low voltage, MEWP",
    visibility: "PUBLIC",
    createdAt: "2026-04-24T10:00:00.000Z",
    updatedAt: "2026-04-29T13:00:00.000Z",
    media: [],
    externalLinks: [],
    privateConversations: [],
    comments: [],
    reviews: [],
  },
  {
    id: "post-professional-chef",
    type: "PROFESSIONAL",
    title: "Mediterranean and Chinese cuisine chef",
    description: "Mediterranean cuisine, Chinese cuisine, menu planning.",
    domain: "Hospitality / Restaurants",
    location: "Greece",
    status: "Looking for project",
    value: "Requested salary: EUR 4,100 gross/month",
    ownerName: "Georgios Mediterranean Chef",
    ownerType: "Professional",
    classificationJson: {
      standards: "ESCO: Chef - NACE: I56",
    },
    certifications: "HACCP, international chef",
    visibility: "PUBLIC",
    createdAt: "2026-04-24T10:00:00.000Z",
    updatedAt: "2026-04-29T13:00:00.000Z",
    media: [],
    externalLinks: [],
    privateConversations: [],
    comments: [],
    reviews: [],
  },
];

function buildUrl(path: string) {
  const apiBase = getApiUrl?.() ?? LOCAL_API_URL;
  return `${apiBase}${path}`;
}

function cloneFallbackPosts() {
  return JSON.parse(JSON.stringify(demoPublicPosts)) as PublicPostRecord[];
}

function fallbackConversation(postId: string, ownerName: string, requesterName: string) {
  return {
    id: `fallback-conversation-${postId}`,
    postId,
    requesterName,
    ownerName,
    status: "OPEN" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

function fallbackMessages(conversationId: string) {
  const posts = cloneFallbackPosts();
  const conversation = posts
    .flatMap((post) => post.privateConversations)
    .find((item) => item.id === conversationId);
  return conversation ? conversation.messages : [];
}

function normalizeReasonsJson(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((item): item is string => typeof item === "string");
}

function normalizeMedia(input: unknown, postId: string): PublicPostMedia[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const candidate = typeof item === "object" && item !== null ? item : {};
    return {
      id:
        typeof (candidate as { id?: unknown }).id === "string"
          ? (candidate as { id: string }).id
          : `${postId}-media-${index}`,
      postId:
        typeof (candidate as { postId?: unknown }).postId === "string"
          ? (candidate as { postId: string }).postId
          : postId,
      url:
        typeof (candidate as { url?: unknown }).url === "string"
          ? (candidate as { url: string }).url
          : "",
      type:
        (candidate as { type?: MediaType }).type === "VIDEO" ? "VIDEO" : "IMAGE",
      alt:
        typeof (candidate as { alt?: unknown }).alt === "string"
          ? (candidate as { alt: string }).alt
          : "",
      status:
        (candidate as { status?: ModerationStatus }).status === "APPROVED" ||
        (candidate as { status?: ModerationStatus }).status === "REJECTED"
          ? (candidate as { status: ModerationStatus }).status
          : "PENDING",
      createdAt:
        typeof (candidate as { createdAt?: unknown }).createdAt === "string"
          ? (candidate as { createdAt: string }).createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
          ? (candidate as { updatedAt: string }).updatedAt
          : new Date().toISOString(),
    };
  });
}

function normalizeMessages(input: unknown, conversationId: string): PrivateMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const candidate = typeof item === "object" && item !== null ? item : {};
    return {
      id:
        typeof (candidate as { id?: unknown }).id === "string"
          ? (candidate as { id: string }).id
          : `${conversationId}-message-${index}`,
      conversationId:
        typeof (candidate as { conversationId?: unknown }).conversationId === "string"
          ? (candidate as { conversationId: string }).conversationId
          : conversationId,
      senderName:
        typeof (candidate as { senderName?: unknown }).senderName === "string"
          ? (candidate as { senderName: string }).senderName
          : "OpenStaff User",
      message:
        typeof (candidate as { message?: unknown }).message === "string"
          ? (candidate as { message: string }).message
          : "",
      status:
        (candidate as { status?: MessageStatus }).status === "PENDING_REVIEW" ||
        (candidate as { status?: MessageStatus }).status === "FLAGGED"
          ? (candidate as { status: MessageStatus }).status
          : "SENT",
      createdAt:
        typeof (candidate as { createdAt?: unknown }).createdAt === "string"
          ? (candidate as { createdAt: string }).createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
          ? (candidate as { updatedAt: string }).updatedAt
          : new Date().toISOString(),
    };
  });
}

function normalizeConversations(input: unknown, postId: string, ownerName: string): PrivateConversation[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const candidate = typeof item === "object" && item !== null ? item : {};
    const conversationId =
      typeof (candidate as { id?: unknown }).id === "string"
        ? (candidate as { id: string }).id
        : `${postId}-conversation-${index}`;

    return {
      id: conversationId,
      postId:
        typeof (candidate as { postId?: unknown }).postId === "string"
          ? (candidate as { postId: string }).postId
          : postId,
      requesterName:
        typeof (candidate as { requesterName?: unknown }).requesterName === "string"
          ? (candidate as { requesterName: string }).requesterName
          : "Approved OpenStaff User",
      ownerName:
        typeof (candidate as { ownerName?: unknown }).ownerName === "string"
          ? (candidate as { ownerName: string }).ownerName
          : ownerName,
      status:
        (candidate as { status?: ConversationStatus }).status === "CLOSED" ||
        (candidate as { status?: ConversationStatus }).status === "FLAGGED"
          ? (candidate as { status: ConversationStatus }).status
          : "OPEN",
      createdAt:
        typeof (candidate as { createdAt?: unknown }).createdAt === "string"
          ? (candidate as { createdAt: string }).createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
          ? (candidate as { updatedAt: string }).updatedAt
          : new Date().toISOString(),
      messages: normalizeMessages((candidate as { messages?: unknown }).messages, conversationId),
    };
  });
}

function normalizeComments(input: unknown, postId: string): PublicComment[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const candidate = typeof item === "object" && item !== null ? item : {};
    return {
      id:
        typeof (candidate as { id?: unknown }).id === "string"
          ? (candidate as { id: string }).id
          : `${postId}-comment-${index}`,
      postId:
        typeof (candidate as { postId?: unknown }).postId === "string"
          ? (candidate as { postId: string }).postId
          : postId,
      authorName:
        typeof (candidate as { authorName?: unknown }).authorName === "string"
          ? (candidate as { authorName: string }).authorName
          : "Marketplace Visitor",
      comment:
        typeof (candidate as { comment?: unknown }).comment === "string"
          ? (candidate as { comment: string }).comment
          : "",
      status:
        (candidate as { status?: FeedbackStatus }).status === "PENDING_REVIEW" ||
        (candidate as { status?: FeedbackStatus }).status === "REJECTED"
          ? (candidate as { status: FeedbackStatus }).status
          : "PUBLISHED",
      createdAt:
        typeof (candidate as { createdAt?: unknown }).createdAt === "string"
          ? (candidate as { createdAt: string }).createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
          ? (candidate as { updatedAt: string }).updatedAt
          : new Date().toISOString(),
    };
  });
}

function normalizeReviews(input: unknown, postId: string): PublicReview[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const candidate = typeof item === "object" && item !== null ? item : {};
    const ratingValue = Number((candidate as { rating?: unknown }).rating);

    return {
      id:
        typeof (candidate as { id?: unknown }).id === "string"
          ? (candidate as { id: string }).id
          : `${postId}-review-${index}`,
      postId:
        typeof (candidate as { postId?: unknown }).postId === "string"
          ? (candidate as { postId: string }).postId
          : postId,
      authorName:
        typeof (candidate as { authorName?: unknown }).authorName === "string"
          ? (candidate as { authorName: string }).authorName
          : "Marketplace Visitor",
      rating: Number.isFinite(ratingValue) ? ratingValue : null,
      review:
        typeof (candidate as { review?: unknown }).review === "string"
          ? (candidate as { review: string }).review
          : "",
      status:
        (candidate as { status?: FeedbackStatus }).status === "PENDING_REVIEW" ||
        (candidate as { status?: FeedbackStatus }).status === "REJECTED"
          ? (candidate as { status: FeedbackStatus }).status
          : "PUBLISHED",
      createdAt:
        typeof (candidate as { createdAt?: unknown }).createdAt === "string"
          ? (candidate as { createdAt: string }).createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
          ? (candidate as { updatedAt: string }).updatedAt
          : new Date().toISOString(),
    };
  });
}

function normalizeExternalLinks(input: unknown, postId: string): ExternalLinkSubmission[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const candidate = typeof item === "object" && item !== null ? item : {};
    return {
      id:
        typeof (candidate as { id?: unknown }).id === "string"
          ? (candidate as { id: string }).id
          : `${postId}-link-${index}`,
      url:
        typeof (candidate as { url?: unknown }).url === "string"
          ? (candidate as { url: string }).url
          : "",
      normalizedUrl:
        typeof (candidate as { normalizedUrl?: unknown }).normalizedUrl === "string"
          ? (candidate as { normalizedUrl: string }).normalizedUrl
          : "",
      sourcePostId:
        typeof (candidate as { sourcePostId?: unknown }).sourcePostId === "string"
          ? (candidate as { sourcePostId: string }).sourcePostId
          : postId,
      submittedBy:
        typeof (candidate as { submittedBy?: unknown }).submittedBy === "string"
          ? (candidate as { submittedBy: string }).submittedBy
          : "OpenStaff user",
      securityStatus:
        (candidate as { securityStatus?: ExternalLinkSubmission["securityStatus"] }).securityStatus ===
          "APPROVED" ||
        (candidate as { securityStatus?: ExternalLinkSubmission["securityStatus"] }).securityStatus ===
          "REJECTED"
          ? (candidate as { securityStatus: ExternalLinkSubmission["securityStatus"] }).securityStatus
          : "PENDING",
      reasonsJson: normalizeReasonsJson((candidate as { reasonsJson?: unknown }).reasonsJson),
      createdAt:
        typeof (candidate as { createdAt?: unknown }).createdAt === "string"
          ? (candidate as { createdAt: string }).createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
          ? (candidate as { updatedAt: string }).updatedAt
          : new Date().toISOString(),
    };
  });
}

function normalizePublicPost(input: unknown, index: number): PublicPostRecord {
  const candidate = typeof input === "object" && input !== null ? input : {};
  const postId =
    typeof (candidate as { id?: unknown }).id === "string"
      ? (candidate as { id: string }).id
      : `fallback-post-${index}`;
  const ownerName =
    typeof (candidate as { ownerName?: unknown }).ownerName === "string"
      ? (candidate as { ownerName: string }).ownerName
      : "OpenStaff owner";

  return {
    id: postId,
    type:
      (candidate as { type?: PublicPostType }).type === "PROFESSIONAL" ||
      (candidate as { type?: PublicPostType }).type === "SUBCONTRACTOR_POOL"
        ? (candidate as { type: PublicPostType }).type
        : "PROJECT",
    title:
      typeof (candidate as { title?: unknown }).title === "string"
        ? (candidate as { title: string }).title
        : "Untitled public post",
    description:
      typeof (candidate as { description?: unknown }).description === "string"
        ? (candidate as { description: string }).description
        : "No description provided.",
    domain:
      typeof (candidate as { domain?: unknown }).domain === "string"
        ? (candidate as { domain: string }).domain
        : "General",
    location:
      typeof (candidate as { location?: unknown }).location === "string"
        ? (candidate as { location: string }).location
        : "Unspecified",
    status:
      typeof (candidate as { status?: unknown }).status === "string"
        ? (candidate as { status: string }).status
        : "Draft",
    value:
      typeof (candidate as { value?: unknown }).value === "string"
        ? (candidate as { value: string }).value
        : "To be confirmed",
    ownerName,
    ownerType:
      typeof (candidate as { ownerType?: unknown }).ownerType === "string"
        ? (candidate as { ownerType: string }).ownerType
        : "Platform user",
    classificationJson:
      typeof (candidate as { classificationJson?: unknown }).classificationJson === "object" &&
      (candidate as { classificationJson?: unknown }).classificationJson !== null
        ? ((candidate as { classificationJson: PublicPostRecord["classificationJson"] }).classificationJson)
        : {},
    certifications:
      typeof (candidate as { certifications?: unknown }).certifications === "string"
        ? (candidate as { certifications: string }).certifications
        : "None specified",
    visibility:
      typeof (candidate as { visibility?: unknown }).visibility === "string"
        ? (candidate as { visibility: string }).visibility
        : "PUBLIC",
    createdAt:
      typeof (candidate as { createdAt?: unknown }).createdAt === "string"
        ? (candidate as { createdAt: string }).createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof (candidate as { updatedAt?: unknown }).updatedAt === "string"
        ? (candidate as { updatedAt: string }).updatedAt
        : new Date().toISOString(),
    media: normalizeMedia((candidate as { media?: unknown }).media, postId),
    externalLinks: normalizeExternalLinks((candidate as { externalLinks?: unknown }).externalLinks, postId),
    privateConversations: normalizeConversations(
      (candidate as { privateConversations?: unknown }).privateConversations,
      postId,
      ownerName,
    ),
    comments: normalizeComments((candidate as { comments?: unknown }).comments, postId),
    reviews: normalizeReviews((candidate as { reviews?: unknown }).reviews, postId),
  };
}

function normalizePublicPosts(input: unknown) {
  if (!Array.isArray(input)) {
    return cloneFallbackPosts();
  }

  return input.map((item, index) => normalizePublicPost(item, index));
}

function fallbackResult<T>(data: T, message: string, ok = false): StructuredResult<T> {
  return {
    ok,
    data,
    source: "fallback",
    message,
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export function mapPostToFeedItem(post: PublicPostRecord): PublicFeedItem {
  const standards =
    typeof post.classificationJson?.standards === "string"
      ? post.classificationJson.standards
      : "Classification metadata available";
  const mediaLabel = post.media[0]
    ? `Optional ${post.media[0].type === "VIDEO" ? "video" : "image"} banner: ${post.media[0].alt || post.media[0].url}`
    : undefined;
  const verified =
    post.type !== "PROJECT" &&
    post.externalLinks.some((item) => item.securityStatus === "APPROVED");

  return {
    id: post.id,
    type: post.type === "PROJECT" ? "project" : "professional",
    ownerName: post.ownerName,
    ownerType: post.ownerType,
    title: post.title,
    location: post.location,
    domain: post.domain,
    status: post.status,
    value: post.value,
    description: post.description,
    standards,
    certifications: post.certifications,
    media: mediaLabel,
    verified,
  };
}

export async function getPublicPosts(): Promise<StructuredResult<PublicPostRecord[]>> {
  try {
    const response = await fetch(buildUrl("/public-posts"), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ApiError(`Public posts request failed with status ${response.status}`, response.status);
    }

    const payload = (await response.json()) as {
      data?: unknown;
      source?: string;
    };
    const posts = normalizePublicPosts(payload?.data);

    return {
      ok: true,
      data: posts,
      source: payload?.source === "placeholder" ? "fallback" : "api",
      message: payload?.source === "placeholder" ? "Loaded placeholder public posts." : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      source: "api",
      message: getErrorMessage(error, "Public posts API unavailable."),
    };
  }
}

export async function createPrivateConversation(
  input: CreateConversationInput,
  token: string | null,
): Promise<StructuredResult<PrivateConversation>> {
  if (!token) {
    return {
      ok: false,
      data: fallbackConversation(input.postId, input.ownerName, input.requesterName),
      source: "api",
      message: "Private chat requires an approved OpenStaff account.",
    };
  }

  try {
    const conversation = await apiRequest<PrivateConversation>("/private-conversations", {
      method: "POST",
      token,
      body: input,
    });

    return {
      ok: true,
      data: {
        ...fallbackConversation(input.postId, input.ownerName, input.requesterName),
        ...conversation,
        messages: normalizeMessages((conversation as { messages?: unknown }).messages, conversation.id),
      },
      source: "api",
    };
  } catch (error) {
    return {
      ok: false,
      data: fallbackConversation(input.postId, input.ownerName, input.requesterName),
      source: "api",
      message: getErrorMessage(error, "Private conversation API unavailable."),
    };
  }
}

export async function getPrivateConversationMessages(
  conversationId: string,
  token: string | null,
): Promise<StructuredResult<PrivateMessage[]>> {
  if (!token) {
    return {
      ok: false,
      data: [],
      source: "api",
      message: "Private messages require an approved OpenStaff account.",
    };
  }

  try {
    const messages = await apiRequest<PrivateMessage[]>(`/private-conversations/${conversationId}/messages`, {
      method: "GET",
      token,
    });

    return {
      ok: true,
      data: normalizeMessages(messages, conversationId),
      source: "api",
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      source: "api",
      message: getErrorMessage(error, "Private messages API unavailable."),
    };
  }
}

export async function sendPrivateMessage(
  conversationId: string,
  input: CreateMessageInput,
  token: string | null,
): Promise<StructuredResult<PrivateMessage>> {
  const fallbackMessage: PrivateMessage = {
    id: `fallback-message-${conversationId}-${Date.now()}`,
    conversationId,
    senderName: input.senderName,
    message: input.message,
    status: "SENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!token) {
    return {
      ok: false,
      data: fallbackMessage,
      source: "api",
      message: "Private messages require an approved OpenStaff account.",
    };
  }

  try {
    const message = await apiRequest<PrivateMessage>(`/private-conversations/${conversationId}/messages`, {
      method: "POST",
      token,
      body: input,
    });

    return {
      ok: true,
      data: {
        ...fallbackMessage,
        ...message,
      },
      source: "api",
    };
  } catch (error) {
    return {
      ok: false,
      data: fallbackMessage,
      source: "api",
      message: getErrorMessage(error, "Private message API unavailable."),
    };
  }
}

export async function getPostComments(postId: string): Promise<StructuredResult<PublicComment[]>> {
  try {
    const comments = await apiRequest<PublicComment[]>(`/public-posts/${postId}/comments`);
    return {
      ok: true,
      data: normalizeComments(comments, postId),
      source: "api",
    };
  } catch (error) {
    const fallbackComments = cloneFallbackPosts().find((post) => post.id === postId)?.comments ?? [];
    return fallbackResult(
      fallbackComments,
      getErrorMessage(error, "Comments API unavailable."),
    );
  }
}

export async function addPostComment(
  postId: string,
  input: CreateCommentInput,
  token: string | null,
): Promise<StructuredResult<PublicComment>> {
  const fallbackComment: PublicComment = {
    id: `fallback-comment-${postId}-${Date.now()}`,
    postId,
    authorName: input.authorName,
    comment: input.comment,
    status: "PENDING_REVIEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!token) {
    return fallbackResult(
      fallbackComment,
      "Comment posting requires an approved OpenStaff account.",
    );
  }

  try {
    const comment = await apiRequest<PublicComment>(`/public-posts/${postId}/comments`, {
      method: "POST",
      token,
      body: input,
    });

    return {
      ok: true,
      data: {
        ...fallbackComment,
        ...comment,
      },
      source: "api",
    };
  } catch (error) {
    return fallbackResult(
      fallbackComment,
      getErrorMessage(error, "Comments API unavailable."),
    );
  }
}

export async function getPostReviews(postId: string): Promise<StructuredResult<PublicReview[]>> {
  try {
    const reviews = await apiRequest<PublicReview[]>(`/public-posts/${postId}/reviews`);
    return {
      ok: true,
      data: normalizeReviews(reviews, postId),
      source: "api",
    };
  } catch (error) {
    const fallbackReviews = cloneFallbackPosts().find((post) => post.id === postId)?.reviews ?? [];
    return fallbackResult(
      fallbackReviews,
      getErrorMessage(error, "Reviews API unavailable."),
    );
  }
}

export async function addPostReview(
  postId: string,
  input: CreateReviewInput,
  token: string | null,
): Promise<StructuredResult<PublicReview>> {
  const fallbackReview: PublicReview = {
    id: `fallback-review-${postId}-${Date.now()}`,
    postId,
    authorName: input.authorName,
    rating: typeof input.rating === "number" ? input.rating : null,
    review: input.review,
    status: "PENDING_REVIEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!token) {
    return fallbackResult(
      fallbackReview,
      "Review posting requires an approved OpenStaff account.",
    );
  }

  try {
    const review = await apiRequest<PublicReview>(`/public-posts/${postId}/reviews`, {
      method: "POST",
      token,
      body: input,
    });

    return {
      ok: true,
      data: {
        ...fallbackReview,
        ...review,
      },
      source: "api",
    };
  } catch (error) {
    return fallbackResult(
      fallbackReview,
      getErrorMessage(error, "Reviews API unavailable."),
    );
  }
}

export function getFallbackPublicPosts() {
  return cloneFallbackPosts();
}
