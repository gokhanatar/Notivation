import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { getWeeklyDigestData, type WeeklyDigestData } from '@/lib/stats/weeklyDigest';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, CheckCircle2, FileText, Flame } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface WeeklyDigestScreenProps {
  onBack: () => void;
}

export function WeeklyDigestScreen({ onBack }: WeeklyDigestScreenProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<WeeklyDigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyDigestData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0" aria-label={t('common.back')}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{t('digest.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('digest.subtitle')}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-6 space-y-6 scrollbar-hide">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label={t('digest.notesCreated')}
            value={data.totalNotesCreated}
            color="text-blue-500"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label={t('digest.actionsCompleted')}
            value={data.totalActionsCompleted}
            color="text-green-500"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={t('digest.completionRate')}
            value={`${data.completionRate}%`}
            color="text-orange-500"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label={t('digest.activeDays')}
            value={`${data.activeDays}/7`}
            color="text-red-500"
          />
        </div>

        {/* Notes by Type - Pie Chart */}
        {data.notesByType.length > 0 && (
          <section className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-sm mb-4">{t('digest.notesByType')}</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={data.notesByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                  >
                    {data.notesByType.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {data.notesByType.map((entry) => (
                <div key={entry.type} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="capitalize">{entry.type}</span>
                  <span className="text-muted-foreground">({entry.count})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Daily Activity - Bar Chart */}
        <section className="p-4 rounded-xl bg-card border border-border">
          <h3 className="font-semibold text-sm mb-4">{t('digest.dailyActivity')}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyActivity}>
              <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="notes" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Notes" />
              <Bar dataKey="actions" fill="#22c55e" radius={[4, 4, 0, 0]} name="Actions" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Top Notes */}
        {data.topNotes.length > 0 && (
          <section className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-sm mb-3">{t('digest.topNotes')}</h3>
            <div className="space-y-2">
              {data.topNotes.map((note, i) => (
                <div key={note.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground font-mono w-5">{i + 1}.</span>
                  <span className="flex-1 truncate">{note.title}</span>
                  <span className="text-xs text-muted-foreground capitalize">{note.type}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border"
    >
      <div className={cn('mb-2', color)}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}
