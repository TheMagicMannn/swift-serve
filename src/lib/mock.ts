export type Job = {
  id: string;
  title: string;
  category: string;
  status: "draft" | "dispatching" | "matched" | "en_route" | "in_progress" | "completed";
  priceMin: number;
  priceMax: number;
  fixedPrice?: number;
  duration: string;
  address: string;
  emergency?: boolean;
  provider?: { name: string; rating: number; jobs: number; avatar: string; eta?: string };
  scheduledFor?: string;
  thumbnail?: string;
};

export const quickActions = [
  { icon: "Tv", label: "Mount TV", color: "from-violet-500 to-indigo-500" },
  { icon: "Wrench", label: "Plumbing", color: "from-cyan-500 to-blue-500" },
  { icon: "Zap", label: "Electrical", color: "from-amber-500 to-orange-500" },
  { icon: "Sofa", label: "Assembly", color: "from-fuchsia-500 to-pink-500" },
  { icon: "Truck", label: "Moving", color: "from-emerald-500 to-teal-500" },
  { icon: "Sparkles", label: "Cleanup", color: "from-rose-500 to-red-500" },
  { icon: "Package", label: "Delivery", color: "from-sky-500 to-cyan-500" },
  { icon: "Siren", label: "Emergency", color: "from-red-500 to-orange-500" },
];

export const recentJobs: Job[] = [
  {
    id: "j1",
    title: "65\" TV mount on drywall",
    category: "Handyman",
    status: "matched",
    priceMin: 120, priceMax: 150, fixedPrice: 135,
    duration: "60–90 min",
    address: "1284 Mission St, SF",
    provider: { name: "Marcus T.", rating: 4.96, jobs: 312, avatar: "MT", eta: "12 min" },
  },
  {
    id: "j2",
    title: "Leaking kitchen sink repair",
    category: "Plumbing",
    status: "completed",
    priceMin: 180, priceMax: 220, fixedPrice: 195,
    duration: "45 min",
    address: "Apt 4B, Oak St",
    provider: { name: "Diane L.", rating: 4.92, jobs: 487, avatar: "DL" },
  },
  {
    id: "j3",
    title: "IKEA wardrobe assembly",
    category: "Assembly",
    status: "completed",
    priceMin: 95, priceMax: 130, fixedPrice: 110,
    duration: "90 min",
    address: "1284 Mission St, SF",
    provider: { name: "Aaron K.", rating: 4.88, jobs: 201, avatar: "AK" },
  },
];

export const dispatchOffers: Job[] = [
  {
    id: "o1",
    title: "Ceiling fan replacement",
    category: "Electrical",
    status: "dispatching",
    priceMin: 0, priceMax: 0, fixedPrice: 165,
    duration: "60 min",
    address: "Pacific Heights · 2.1 mi",
  },
  {
    id: "o2",
    title: "Move couch upstairs (3rd floor)",
    category: "Moving",
    status: "dispatching",
    priceMin: 0, priceMax: 0, fixedPrice: 95,
    duration: "30 min",
    address: "SOMA · 0.8 mi",
    emergency: false,
  },
  {
    id: "o3",
    title: "Burst pipe — water shutoff needed",
    category: "Plumbing",
    status: "dispatching",
    priceMin: 0, priceMax: 0, fixedPrice: 320,
    duration: "ASAP",
    address: "Mission · 1.4 mi",
    emergency: true,
  },
];

export const earnings = {
  today: 412,
  week: 2840,
  month: 11_280,
  pending: 380,
  jobsToday: 4,
  rating: 4.94,
  acceptance: 96,
};

export const chatMessages = [
  { from: "provider", text: "Hi! On my way — should be there in about 12 min.", time: "2:04 PM" },
  { from: "system", text: "Marcus marked himself as en route", time: "2:04 PM" },
  { from: "customer", text: "Great! Front door code is 4421. TV is in the living room.", time: "2:05 PM" },
  { from: "provider", text: "Got it. I'll text when I arrive.", time: "2:05 PM" },
];
