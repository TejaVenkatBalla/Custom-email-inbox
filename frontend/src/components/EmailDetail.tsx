
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmailItem, apiService } from '../services/api';
import { Calendar, User, Download, FileText, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailDetailProps {
  email: EmailItem;
}

const EmailDetail = ({ email }: EmailDetailProps) => {
  const { toast } = useToast();

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadAttachment = async (filename: string) => {
    try {
      const blob = await apiService.downloadAttachment(email.id, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `${filename} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Failed to download attachment',
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="space-y-3">
          <CardTitle className="text-lg leading-relaxed">
            {email.subject || 'No Subject'}
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{email.sender}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(email.timestamp)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {email.attachments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Attachments ({email.attachments.length})</span>
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{attachment.filename}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{attachment.content_type}</span>
                        <span>•</span>
                        <span>{formatFileSize(attachment.size)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadAttachment(attachment.filename)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Email content preview is not available in this version.</p>
          <p className="text-sm">Focus on managing attachments and email metadata.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailDetail;
