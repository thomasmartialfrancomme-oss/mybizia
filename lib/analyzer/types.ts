export type Category = 'SEO' | 'CONTENU' | 'TECHNIQUE' | 'MOBILE' | 'ACCESSIBILITÉ' | 'CONVERSION' | 'PERFORMANCE';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'good';
export type ResultStatus = 'pass' | 'warning' | 'fail' | 'unavailable';

export type AnalysisResult = {
  id: string;
  category: Category;
  rule: string;
  status: ResultStatus;
  severity: Severity;
  score: number;
  title: string;
  evidence: string;
  recommendation: string;
  pageUrl?: string;
};

export type PageSnapshot = {
  url: string;
  status: number;
  responseMs: number;
  html: string;
  contentType: string;
  size: number;
  depth: number;
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  links: { href: string; text: string; external: boolean }[];
  images: { src: string; alt: string }[];
  scripts: number;
  forms: number;
  hasViewport: boolean;
  lang: string;
};

export type ScoreSet = Record<Category, number> & { global: number };

export type AnalysisReport = {
  id: string;
  url: string;
  createdAt: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  pageCount: number;
  requestedPageCount: number;
  scores: ScoreSet;
  results: AnalysisResult[];
  pages: Pick<PageSnapshot, 'url' | 'status' | 'responseMs' | 'size' | 'depth' | 'title'>[];
  positives: string[];
  summary: string;
  limitations: string[];
  aiAvailable: boolean;
};
