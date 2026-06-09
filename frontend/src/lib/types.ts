export interface ColumnInfo {
  name: string;
  dtype: string;
  role: string;
  missing_pct: number;
  unique_count: number;
  sample_values: unknown[];
}

export interface DatasetProfile {
  filename: string;
  rows: number;
  columns: number;
  column_info: ColumnInfo[];
  missing_pct: number;
  duplicate_rows: number;
  quality_score: number;
  relationships: string[];
}

export interface Insight {
  metric_name: string;
  statistical_value: unknown;
  confidence_score: number;
  business_interpretation: string;
  recommended_visualization: string;
  layer: string;
}

export interface DatasetAnalysis {
  filename: string;
  descriptive: Insight[];
  diagnostic: Insight[];
  predictive: Insight[];
  business: Insight[];
  core_metrics: { label: string; value: string; interpretation: string }[];
  executive_summary: string;
  recommendations: string[];
  columns: string[];
}

export interface AnalysisResponse {
  session_id: string;
  datasets: DatasetAnalysis[];
  cross_dataset_insights: string[];
}

export interface ChartMetadata {
  chart_id: string;
  dataset: string;
  plot_type: string;
  title: string;
  x_axis: string;
  y_axis: string;
  trend_direction: string;
  statistical_significance: string;
  key_observations: string[];
  image_url: string;
}

export interface VisualizationsResponse {
  session_id: string;
  charts: ChartMetadata[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  sources?: string[];
}

export interface PlaygroundRequest {
  session_id: string;
  dataset: string;
  columns: string[];
  prompt: string;
}

export interface PlaygroundResponse {
  chart: ChartMetadata | null;
  insights: Insight[];
  summary: string;
}

export interface UploadResponse {
  session_id: string;
  datasets: DatasetProfile[];
}
