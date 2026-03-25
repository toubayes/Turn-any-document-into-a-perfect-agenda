export interface AgendaItem {
  topic: string;
  summary: string;
  actionItems: string[];
  stakeholders: string[];
  durationMinutes: number;
}

export interface MeetingAgenda {
  title: string;
  overallSummary: string;
  items: AgendaItem[];
}
