import React, { useState, useCallback } from "react";
import { 
  FileText, 
  Upload, 
  Clock, 
  Users, 
  CheckSquare, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "./lib/utils";
import { extractTextFromFile, generateAgenda } from "./services/agendaService";
import { MeetingAgenda, AgendaItem } from "./types";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agenda, setAgenda] = useState<MeetingAgenda | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetDuration, setTargetDuration] = useState<number>(60);

  const totalDuration = agenda?.items.reduce((acc, item) => acc + item.durationMinutes, 0) || 0;

  const calculateAvailableMinutes = () => {
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    const start = new Date(meetingDate);
    start.setHours(sH, sM, 0, 0);
    const end = new Date(meetingDate);
    end.setHours(eH, eM, 0, 0);
    
    // Handle overnight meetings if necessary, but usually same day
    if (end < start) end.setDate(end.getDate() + 1);
    
    return Math.round((end.getTime() - start.getTime()) / 60000);
  };

  const availableMinutes = calculateAvailableMinutes();
  const timeDiff = availableMinutes - totalDuration;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromFile(file);
      const generatedAgenda = await generateAgenda(text);
      setAgenda(generatedAgenda);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAgenda(null);
    setError(null);
  };

  const calculateTopicTime = (index: number) => {
    if (!agenda) return "";
    
    let totalMinutesBefore = 0;
    for (let i = 0; i < index; i++) {
      totalMinutesBefore += agenda.items[i].durationMinutes;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const date = new Date(meetingDate);
    date.setHours(hours, minutes + totalMinutesBefore, 0, 0);

    const endHour = new Date(date);
    endHour.setMinutes(date.getMinutes() + agenda.items[index].durationMinutes);

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    return `${formatTime(date)} - ${formatTime(endHour)}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-[#E2E8F0]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-[#1A1A1A] p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">AgendaCraft AI</h1>
          </div>
          {agenda && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!agenda ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#111827]">
                  Turn any document into a <span className="text-[#3B82F6]">perfect agenda</span>
                </h2>
                <p className="text-lg text-[#6B7280]">
                  Upload a DOCX or Markdown file. Our AI will extract topics, action items, stakeholders, and timing for your next meeting.
                </p>
              </div>

              <div className="w-full max-w-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider ml-1">Meeting Date</label>
                    <input 
                      type="date" 
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-[#D1D5DB] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider ml-1">Start Time</label>
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-[#D1D5DB] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider ml-1">End Time</label>
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-[#D1D5DB] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <label 
                  className={cn(
                    "relative group block w-full aspect-[16/9] border-2 border-dashed rounded-3xl transition-all cursor-pointer",
                    file ? "border-[#3B82F6] bg-[#EFF6FF]" : "border-[#D1D5DB] hover:border-[#3B82F6] hover:bg-white"
                  )}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".docx,.md,.txt"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4">
                    <div className={cn(
                      "p-4 rounded-2xl transition-transform group-hover:scale-110",
                      file ? "bg-[#3B82F6] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                    )}>
                      {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg">
                        {file ? file.name : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        DOCX, Markdown, or Text (max 10MB)
                      </p>
                    </div>
                  </div>
                </label>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="mt-4 text-sm text-red-500 font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  onClick={processFile}
                  disabled={!file || isProcessing}
                  className={cn(
                    "mt-8 w-full py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all",
                    !file || isProcessing 
                      ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed" 
                      : "bg-[#1A1A1A] text-white hover:bg-[#333] active:scale-[0.98] shadow-lg shadow-black/5"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing Document...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Agenda
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="agenda"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Agenda Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2 text-[#3B82F6] font-semibold text-sm uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Generated Agenda
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-[#111827]">
                    {agenda.title}
                  </h2>
                  <div className="prose prose-slate max-w-none text-lg text-[#4B5563] leading-relaxed">
                    <ReactMarkdown>{agenda.overallSummary}</ReactMarkdown>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-4 w-full md:w-80 shrink-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.1em] flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[#3B82F6]" />
                        Meeting Date
                      </label>
                      <input 
                        type="date" 
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.1em]">Start</label>
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.1em]">End</label>
                        <input 
                          type="time" 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F3F4F6] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280] font-medium">Available Time</span>
                      <span className="font-bold text-[#111827]">{availableMinutes} min</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280] font-medium">Topic Total</span>
                      <span className="font-bold text-[#111827]">{totalDuration} min</span>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg text-[10px] font-bold uppercase text-center",
                      timeDiff >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                      {timeDiff >= 0 ? `${timeDiff} min remaining` : `${Math.abs(timeDiff)} min over capacity`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Agenda Items */}
              <div className="grid gap-6">
                {agenda.items.map((item, idx) => (
                  <AgendaCard 
                    key={idx} 
                    item={item} 
                    index={idx} 
                    timeSlot={calculateTopicTime(idx)}
                  />
                ))}
              </div>

              {/* Summary Stats */}
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 flex flex-wrap gap-12 items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">Total Topics</p>
                  <p className="text-3xl font-bold text-[#111827]">{agenda.items.length}</p>
                </div>
                <div className="w-px h-12 bg-[#E5E7EB] hidden md:block" />
                <div className="text-center">
                  <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">Total Duration</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {agenda.items.reduce((acc, item) => acc + item.durationMinutes, 0)} min
                  </p>
                </div>
                <div className="w-px h-12 bg-[#E5E7EB] hidden md:block" />
                <div className="text-center">
                  <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">Action Items</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {agenda.items.reduce((acc, item) => acc + item.actionItems.length, 0)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function AgendaCard({ item, index, timeSlot }: { item: AgendaItem; index: number; timeSlot: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative flex gap-6"
    >
      {/* Timeline Connector */}
      <div className="hidden md:flex flex-col items-center w-12 shrink-0">
        <div className="w-px h-full bg-[#E5E7EB] group-last:h-8" />
        <div className="absolute top-8 w-3 h-3 rounded-full bg-[#3B82F6] ring-4 ring-blue-100" />
      </div>

      <div className="flex-1 bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden hover:border-[#3B82F6] hover:shadow-xl hover:shadow-blue-500/5 transition-all p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-[#F3F4F6] text-[#6B7280] text-sm font-bold group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                {index + 1}
              </span>
              <h3 className="text-2xl font-bold text-[#111827]">{item.topic}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#3B82F6] md:ml-0 ml-11 uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              {timeSlot}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] rounded-full text-sm font-semibold text-[#4B5563]">
            {item.durationMinutes} min
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-[#4B5563]">
          <ReactMarkdown>{item.summary}</ReactMarkdown>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-[#F3F4F6]">
          {/* Action Items */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827] uppercase tracking-wider">
              <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
              Action Items
            </div>
            <ul className="space-y-3">
              {item.actionItems.map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#4B5563]">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-[#D1D5DB] flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Stakeholders */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827] uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#3B82F6]" />
              Stakeholders
            </div>
            <div className="flex flex-wrap gap-2">
              {item.stakeholders.map((person, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#4B5563]"
                >
                  {person}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
