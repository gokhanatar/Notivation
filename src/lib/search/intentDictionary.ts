// Intent dictionary for semantic search
// Maps short queries to related concepts (multi-language)

export const intentDictionary: Record<string, string[]> = {
  // Work-related
  'iş': ['iş', 'çalışma', 'meslek', 'kariyer', 'toplantı', 'müşteri', 'proje', 'patron', 'maaş', 'ofis', 'mesai', 'şirket', 'iş görüşmesi', 'work', 'job', 'career', 'meeting', 'client', 'project', 'boss', 'salary', 'office', 'company'],
  'work': ['work', 'job', 'career', 'meeting', 'client', 'project', 'boss', 'salary', 'office', 'company', 'business', 'profession', 'employment', 'iş', 'çalışma', 'toplantı'],
  'job': ['job', 'work', 'career', 'employment', 'position', 'role', 'occupation', 'profession'],
  
  // Family-related
  'aile': ['aile', 'anne', 'baba', 'çocuk', 'eş', 'kardeş', 'ev', 'evlilik', 'family', 'parents', 'children', 'home'],
  'family': ['family', 'parents', 'children', 'home', 'kids', 'spouse', 'relatives', 'siblings', 'aile', 'anne', 'baba'],
  'ev': ['ev', 'konut', 'daire', 'kira', 'taşınma', 'dekorasyon', 'mobilya', 'home', 'house', 'apartment'],
  'home': ['home', 'house', 'apartment', 'rent', 'moving', 'decoration', 'furniture', 'ev', 'konut'],
  
  // Health-related
  'sağlık': ['sağlık', 'doktor', 'hastane', 'ilaç', 'tedavi', 'hastalık', 'egzersiz', 'diyet', 'health', 'doctor', 'hospital', 'medicine'],
  'health': ['health', 'doctor', 'hospital', 'medicine', 'treatment', 'exercise', 'diet', 'wellness', 'sağlık', 'doktor'],
  
  // Money/Finance
  'para': ['para', 'banka', 'kredi', 'borç', 'fatura', 'ödeme', 'tasarruf', 'yatırım', 'bütçe', 'money', 'bank', 'credit', 'payment'],
  'money': ['money', 'bank', 'credit', 'debt', 'bill', 'payment', 'savings', 'investment', 'budget', 'finance', 'para', 'banka'],
  'bütçe': ['bütçe', 'para', 'harcama', 'gelir', 'gider', 'tasarruf', 'budget', 'spending', 'income', 'expense'],
  'budget': ['budget', 'money', 'spending', 'income', 'expense', 'savings', 'financial', 'bütçe', 'harcama'],
  
  // Education
  'eğitim': ['eğitim', 'okul', 'üniversite', 'ders', 'sınav', 'öğrenci', 'öğretmen', 'kurs', 'education', 'school', 'university'],
  'education': ['education', 'school', 'university', 'class', 'exam', 'student', 'teacher', 'course', 'learning', 'eğitim', 'okul'],
  'okul': ['okul', 'eğitim', 'ders', 'öğretmen', 'öğrenci', 'sınav', 'school', 'education', 'class'],
  'school': ['school', 'education', 'class', 'teacher', 'student', 'exam', 'learning', 'okul', 'eğitim'],
  
  // Travel
  'seyahat': ['seyahat', 'tatil', 'uçak', 'otel', 'bilet', 'gezi', 'tur', 'travel', 'vacation', 'trip', 'flight'],
  'travel': ['travel', 'vacation', 'trip', 'flight', 'hotel', 'ticket', 'tour', 'journey', 'seyahat', 'tatil'],
  
  // Shopping
  'alışveriş': ['alışveriş', 'mağaza', 'market', 'satın alma', 'ürün', 'fiyat', 'indirim', 'shopping', 'store', 'market'],
  'shopping': ['shopping', 'store', 'market', 'purchase', 'product', 'price', 'discount', 'buy', 'alışveriş', 'mağaza'],
  
  // Time-related
  'bugün': ['bugün', 'today', 'günlük', 'daily'],
  'today': ['today', 'daily', 'bugün', 'günlük'],
  'yarın': ['yarın', 'tomorrow', 'sonraki gün'],
  'tomorrow': ['tomorrow', 'next day', 'yarın'],
  'hafta': ['hafta', 'haftalık', 'week', 'weekly'],
  'week': ['week', 'weekly', 'hafta', 'haftalık'],
  
  // Priority/Importance
  'önemli': ['önemli', 'acil', 'kritik', 'öncelik', 'important', 'urgent', 'critical', 'priority'],
  'important': ['important', 'urgent', 'critical', 'priority', 'essential', 'önemli', 'acil', 'kritik'],
  'acil': ['acil', 'önemli', 'hemen', 'urgent', 'emergency', 'asap'],
  'urgent': ['urgent', 'important', 'immediate', 'emergency', 'asap', 'acil', 'önemli'],
  
  // Common short queries
  'not': ['not', 'nota', 'notlar', 'kayıt', 'yazı', 'note', 'notes'],
  'note': ['note', 'notes', 'record', 'not', 'kayıt'],
  'fikir': ['fikir', 'düşünce', 'öneri', 'idea', 'thought', 'suggestion'],
  'idea': ['idea', 'thought', 'suggestion', 'concept', 'fikir', 'düşünce'],

  // Question-related
  'soru': ['soru', 'cevap', 'neden', 'nasıl', 'nerede', 'kim', 'ne zaman', 'merak', 'question', 'answer', 'why', 'how'],
  'question': ['question', 'answer', 'why', 'how', 'where', 'who', 'when', 'wonder', 'soru', 'cevap', 'neden', 'nasıl'],

  // Journal-related
  'günlük': ['günlük', 'jurnal', 'duygu', 'his', 'gün', 'yansıma', 'düşünce', 'journal', 'diary', 'reflection'],
  'journal': ['journal', 'diary', 'reflection', 'feeling', 'emotion', 'day', 'morning', 'evening', 'günlük', 'yansıma'],

  // Time-based context patterns (B1)
  'sabah': ['sabah', 'morning', 'erken', 'kahvaltı', 'uyanmak'],
  'morning': ['morning', 'early', 'breakfast', 'wake', 'sabah'],
  'akşam': ['akşam', 'aksam', 'evening', 'gece', 'yemek', 'dinner'],
  'evening': ['evening', 'dinner', 'night', 'akşam', 'aksam'],
  'gece': ['gece', 'night', 'geç', 'uyku', 'sleep'],
  'night': ['night', 'late', 'sleep', 'gece', 'uyku'],
  'hafta sonu': ['hafta sonu', 'weekend', 'cumartesi', 'pazar', 'tatil'],
  'weekend': ['weekend', 'saturday', 'sunday', 'hafta sonu', 'cumartesi', 'pazar'],
};

// Get intent keywords for a short query
export function getIntentKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  
  // Direct match
  if (intentDictionary[lowerQuery]) {
    return intentDictionary[lowerQuery];
  }
  
  // Partial match for slightly longer queries
  for (const [key, keywords] of Object.entries(intentDictionary)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      return keywords;
    }
  }
  
  return [];
}

// Check if a text contains any of the intent keywords as whole words
export function matchesIntentKeywords(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  
  const lowerText = text.toLowerCase();
  let matchCount = 0;
  
  for (const keyword of keywords) {
    // Use word boundary matching to avoid substring matches
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(lowerText)) {
      matchCount++;
    }
  }
  
  return matchCount / keywords.length; // Return a score between 0 and 1
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
