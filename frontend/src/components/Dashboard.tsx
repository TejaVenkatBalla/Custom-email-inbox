
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, EmailItem } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import { RefreshCw, LogOut, User, Mail, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const fetchedEmails = await apiService.getEmails();
      setEmails(fetchedEmails);
      if (initialLoad && fetchedEmails.length > 0) {
        setSelectedEmail(fetchedEmails[0]);
        setInitialLoad(false);
      }
      toast({
        title: "Emails Updated",
        description: `Found ${fetchedEmails.length} emails in your inbox.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch emails',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out properly.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Email Dashboard</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchEmails}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Inbox className="h-5 w-5" />
                  <span>Inbox ({emails.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                <EmailList
                  emails={emails}
                  onEmailSelect={setSelectedEmail}
                  selectedEmailId={selectedEmail?.id}
                />
              </CardContent>
            </Card>
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-2">
            {selectedEmail ? (
              <EmailDetail email={selectedEmail} />
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Select an email
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose an email from the list to view its details and attachments.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
