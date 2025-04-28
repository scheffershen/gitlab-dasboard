import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

interface ActivityReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  reportContent: string;
  isGeneratingReport: boolean;
  isSpeaking: boolean;
  onReadAloud: () => Promise<string>;
}

export function ActivityReportDialog({
  isOpen,
  onOpenChange,
  selectedDate,
  reportContent,
  isGeneratingReport,
  isSpeaking,
  onReadAloud
}: ActivityReportDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    if (!isGeneratingReport && reportContent && !audioUrl && !isGeneratingAudio) {
      setIsGeneratingAudio(true);
      onReadAloud()
        .then(url => {
          setAudioUrl(url);
          setIsGeneratingAudio(false);
        })
        .catch(() => {
          setIsGeneratingAudio(false);
        });
    }
  }, [isGeneratingReport, reportContent, audioUrl, isGeneratingAudio, onReadAloud]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={isSpeaking ? () => {} : onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'w-screen h-screen max-w-none m-0' : 'max-w-3xl'}`}>
        <DialogHeader>
          <div className="flex items-center">
            <div className="flex-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
            <DialogTitle className="flex-1 text-center">
              Rapport de Développement - {selectedDate}
            </DialogTitle>
            <div className="flex-none w-10"></div>
          </div>
        </DialogHeader>
        <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'max-h-[60vh]'}`}>
          {isGeneratingReport ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {audioUrl && (
                <div className="sticky top-0 bg-background z-10 p-4 border-b">
                  <audio 
                    controls 
                    className="w-full"
                    src={audioUrl}
                  />
                </div>
              )}
              <div
                className="prose dark:prose-invert max-w-none px-4 text-xl"
                dangerouslySetInnerHTML={{
                  __html: reportContent
                }}
              />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 