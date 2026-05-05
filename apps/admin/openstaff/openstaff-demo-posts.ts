export type Post = {
  id: string;
  section: "project" | "professional";
  ownerName: string;
  ownerType: string;
  ownerCountry: string;
  title: string;
  location: string;
  domain: string;
  status: string;
  value: string;
  description: string;
  roles: string;
  standards: string;
  certifications: string;
  verified?: boolean;
  urgent?: boolean;
  postedAgo: string;
  views: number;
  applicants?: number;
};

export const projects: Post[] = [
  // lipește aici cele 20 proiecte din codul tău
];

export const professionals: Post[] = [
  // lipește aici cei 20 profesioniști din codul tău
];

export const allPosts = [...projects, ...professionals];