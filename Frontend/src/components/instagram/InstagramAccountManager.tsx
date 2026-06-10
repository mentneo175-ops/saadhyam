import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, Loader2 } from "lucide-react";

interface InstagramAccount {
  id: number;
  ig_username: string;
  page_name: string;
  is_active: boolean;
  connected_at: string;
}

interface InstagramAccountManagerProps {
  accounts: InstagramAccount[];
  onConnect: () => void;
  onDisconnect: (accountId: number) => void;
  isLoading?: boolean;
}

export const InstagramAccountManager: React.FC<InstagramAccountManagerProps> = ({
  accounts,
  onConnect,
  onDisconnect,
  isLoading = false,
}) => {
  const [disconnecting, setDisconnecting] = useState<number | null>(null);

  const handleDisconnect = async (accountId: number) => {
    setDisconnecting(accountId);
    try {
      await onDisconnect(accountId);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📱</span>
          Connected Instagram Accounts
        </CardTitle>
        <CardDescription>Manage your Instagram Business Account connections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-gray-500 mb-4">No Instagram accounts connected yet</p>
              <Button onClick={onConnect} disabled={isLoading} size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect Instagram Account
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full">
                        <span className="text-white font-bold">📷</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{account.ig_username}</p>
                        <p className="text-sm text-gray-600">{account.page_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_active && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <Check className="h-4 w-4" />
                          <span>Connected</span>
                        </div>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={disconnecting === account.id}
                          >
                            {disconnecting === account.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle>Disconnect Instagram Account?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the connection to @{account.ig_username}. You can
                            reconnect anytime.
                          </AlertDialogDescription>
                          <div className="flex justify-end gap-2">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDisconnect(account.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={onConnect} variant="outline" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Another Account
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
