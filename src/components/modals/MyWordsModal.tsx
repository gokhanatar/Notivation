import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { BookOpen, Cloud, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getTopWords,
  getUniqueTerms,
  getVocabularyGrowth,
  type WordFrequency,
  type VocabularyGrowth,
} from '@/lib/myWords/myWordsEngine';

interface MyWordsModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type TabType = 'cloud' | 'language' | 'growth';

const WORD_COLORS = [
  'text-primary',
  'text-blue-500',
  'text-purple-500',
  'text-emerald-500',
  'text-amber-500',
];

function getWordSize(count: number, maxCount: number): string {
  if (maxCount === 0) return 'text-xs';
  const ratio = count / maxCount;
  if (ratio > 0.8) return 'text-3xl';
  if (ratio > 0.6) return 'text-2xl';
  if (ratio > 0.4) return 'text-xl';
  if (ratio > 0.25) return 'text-lg';
  if (ratio > 0.15) return 'text-base';
  if (ratio > 0.08) return 'text-sm';
  return 'text-xs';
}

export function MyWordsModal({ open, onOpenChange }: MyWordsModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('cloud');
  const [cloudWords, setCloudWords] = useState<WordFrequency[]>([]);
  const [topWords, setTopWords] = useState<WordFrequency[]>([]);
  const [uniqueTerms, setUniqueTerms] = useState<WordFrequency[]>([]);
  const [growth, setGrowth] = useState<VocabularyGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const loadData = async () => {
      const [cloud, top, unique, vocab] = await Promise.all([
        getTopWords(40),
        getTopWords(10),
        getUniqueTerms(10),
        getVocabularyGrowth(),
      ]);
      setCloudWords(cloud);
      setTopWords(top);
      setUniqueTerms(unique);
      setGrowth(vocab);
      setLoading(false);
    };

    loadData();
  }, [open]);

  const tabs: { key: TabType; label: string; icon: typeof Cloud }[] = [
    { key: 'cloud', label: t('myWords.cloud'), icon: Cloud },
    { key: 'language', label: t('myWords.language'), icon: BookOpen },
    { key: 'growth', label: t('myWords.growth'), icon: TrendingUp },
  ];

  const maxCount = cloudWords.length > 0 ? cloudWords[0].count : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('myWords.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-16"
              >
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : (
              <>
                {/* Cloud Tab */}
                {activeTab === 'cloud' && (
                  <motion.div
                    key="cloud"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="py-4"
                  >
                    {cloudWords.length === 0 ? (
                      <div className="text-center py-12">
                        <Cloud className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">{t('myWords.noData')}</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-2 px-2">
                        {cloudWords.map((word, idx) => (
                          <span
                            key={word.word}
                            className={cn(
                              'font-medium cursor-default transition-transform hover:scale-110',
                              getWordSize(word.count, maxCount),
                              WORD_COLORS[idx % WORD_COLORS.length]
                            )}
                          >
                            {word.word}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Language Tab */}
                {activeTab === 'language' && (
                  <motion.div
                    key="language"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="py-4 space-y-6"
                  >
                    {topWords.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">{t('myWords.noData')}</p>
                      </div>
                    ) : (
                      <>
                        {/* Top Words */}
                        <div>
                          <h3 className="text-sm font-semibold mb-3">{t('myWords.topWords')}</h3>
                          <div className="space-y-2">
                            {topWords.map((word, idx) => (
                              <div
                                key={word.word}
                                className="flex items-center gap-3"
                              >
                                <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">
                                  {idx + 1}.
                                </span>
                                <span className="text-sm font-medium flex-1">{word.word}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {word.count} {t('myWords.times')}
                                </span>
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{
                                      width: `${topWords.length > 0 ? (word.count / topWords[0].count) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Unique Terms */}
                        {uniqueTerms.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-3">{t('myWords.uniqueTerms')}</h3>
                            <div className="flex flex-wrap gap-2">
                              {uniqueTerms.map((word) => (
                                <span
                                  key={word.word}
                                  className="px-2.5 py-1 bg-muted/60 rounded-lg text-xs font-medium"
                                >
                                  {word.word}
                                  <span className="ml-1 text-muted-foreground">
                                    {word.count}x
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* Growth Tab */}
                {activeTab === 'growth' && (
                  <motion.div
                    key="growth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="py-4"
                  >
                    {growth.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">{t('myWords.noData')}</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">{t('myWords.uniqueWordsOverTime')}</h3>
                        <div style={{ width: '100%', height: 250 }}>
                          <ResponsiveContainer>
                            <LineChart data={growth}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                }}
                                labelFormatter={(label) => label}
                                formatter={(value: number) => [value, t('myWords.wordsUsed')]}
                              />
                              <Line
                                type="monotone"
                                dataKey="uniqueWords"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
