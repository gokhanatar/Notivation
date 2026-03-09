import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { hapticLight, hapticSuccess } from '@/lib/native/haptics';
import { X, Mic, Square, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  open: boolean;
  onClose: () => void;
  onSave: (audioBase64: string) => void;
}

export function VoiceRecorder({ open, onClose, onSave }: VoiceRecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      hapticLight();

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch {
      // Microphone not available
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSave = async () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      hapticSuccess();
      onSave(base64);
      handleClose();
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleClose = () => {
    stopRecording();
    setAudioBlob(null);
    setDuration(0);
    onClose();
  };

  if (!open) return null;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl p-6 shadow-lg mx-4 w-full max-w-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-lg">{t('voice.title')}</h3>
            <button onClick={handleClose} className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center tap-target" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <span className="text-4xl font-bold tabular-nums">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            {!isRecording && !audioBlob && (
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                onClick={startRecording}
              >
                <Mic className="w-7 h-7 text-white" />
              </Button>
            )}

            {isRecording && (
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 animate-pulse"
                onClick={stopRecording}
              >
                <Square className="w-6 h-6 text-white" />
              </Button>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button variant="outline" onClick={() => { setAudioBlob(null); setDuration(0); }}>
                  {t('voice.reRecord')}
                </Button>
                <Button onClick={handleSave} className="bg-primary">
                  <Check className="w-4 h-4 mr-2" />
                  {t('voice.save')}
                </Button>
              </>
            )}
          </div>

          {audioBlob && (
            <div className="mt-4">
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-10" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
