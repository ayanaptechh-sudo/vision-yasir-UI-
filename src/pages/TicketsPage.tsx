import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { SupportTicket } from '../types/auth';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
  X,
  User,
  Shield,
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.listSupportTickets();
      setTickets(res.tickets);
    } catch (err: any) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await ApiClient.updateTicketStatus(selectedTicket._id, selectedStatus, replyText);
      setNotice(`Ticket ${selectedTicket.ticketNumber} updated to ${selectedStatus}.`);
      setSelectedTicket(null);
      await fetchTickets();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Support & Appeals Desk
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Process student and faculty inquiries, lockout appeals, and account assistance tickets.
              </p>
            </div>
          </div>

          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
            <span>Refresh Tickets</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket #, user email, subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          >
            <option value="ALL">All Ticket Statuses</option>
            <option value="PENDING">PENDING (Action Required)</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTickets.map((t) => (
          <div
            key={t._id}
            className="p-5 rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-600 dark:text-cyan-400 text-xs">{t.ticketNumber}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === 'COMPLETED'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                    : t.status === 'IN_PROGRESS'
                    ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                    : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                }`}
              >
                {t.status}
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{t.subject}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {t.email} ({t.name})
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 line-clamp-3 leading-relaxed">
              &ldquo;{t.message}&rdquo;
            </p>

            {t.adminReply && (
              <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 text-cyan-900 dark:text-cyan-200 text-xs">
                <strong className="text-cyan-700 dark:text-cyan-300">Staff Response:</strong> {t.adminReply}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTicket(t);
                  setSelectedStatus(t.status);
                  setReplyText(t.adminReply || '');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Review & Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#0c1424] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No support tickets matching your search query.
        </div>
      )}

      {/* TICKET REVIEW MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
          <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 shadow-2xl relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-500" />
                <span>Review Appeal: {selectedTicket.ticketNumber}</span>
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-slate-900 dark:text-slate-100 font-bold">{selectedTicket.subject}</div>
                <div className="text-slate-500 dark:text-slate-400 leading-relaxed">{selectedTicket.message}</div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Resolution Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Official Response
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Enter administrator notes or resolution message..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Save & Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
