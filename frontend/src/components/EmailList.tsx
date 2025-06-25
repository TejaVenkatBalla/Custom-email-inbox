
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmailItem } from '../services/api';
import { Mail, Paperclip, Calendar } from 'lucide-react';

interface EmailListProps {
  emails: EmailItem[];
  onEmailSelect: (email: EmailItem) => void;
  selectedEmailId?: string;
}

const EmailList = ({ emails, onEmailSelect, selectedEmailId }: EmailListProps) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No emails found</h3>
        <p className="text-sm text-muted-foreground">
          Your email list will appear here once we fetch them from your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <Card
          key={email.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedEmailId === email.id ? 'ring-2 ring-primary bg-primary/5' : ''
          }`}
          onClick={() => onEmailSelect(email)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {email.sender}
                  </p>
                  {email.has_attachments && (
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                  {email.subject || 'No Subject'}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(email.timestamp)}
                    </span>
                  </div>
                  {email.attachments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmailList;
