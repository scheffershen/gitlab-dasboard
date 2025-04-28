import { useState } from 'react';
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
  onReadAloud: () => void;
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
              {reportContent && !isGeneratingReport && (
                <Button
                  className="ml-4"
                  size="sm"
                  variant="outline"
                  onClick={onReadAloud}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? 'Lecture en cours...' : '🔊 Lire à voix haute'}
                </Button>
              )}
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
            <div
              className="prose dark:prose-invert max-w-none px-4"
              dangerouslySetInnerHTML={{
                __html: reportContent
              }}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 