import { useState, forwardRef } from 'react';
import { Wallet, Plus, Trash2, Zap, Globe, WalletMinimal, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNWC } from '@/hooks/useNWCContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { NWCConnection, NWCInfo } from '@/hooks/useNWC';

interface WalletModalProps {
  children?: React.ReactNode;
  className?: string;
}

// Extracted AddWalletContent to prevent re-renders
const AddWalletContent = forwardRef<HTMLDivElement, {
  alias: string;
  setAlias: (value: string) => void;
  connectionUri: string;
  setConnectionUri: (value: string) => void;
}>(({ alias, setAlias, connectionUri, setConnectionUri }, ref) => (
  <div className="space-y-4 px-4" ref={ref}>
    <div>
      <Label htmlFor="alias">Wallet Name (optional)</Label>
      <Input
        id="alias"
        placeholder="My Lightning Wallet"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
    </div>
    <div>
      <Label htmlFor="connection-uri">Connection URI</Label>
      <Textarea
        id="connection-uri"
        placeholder="nostr+walletconnect://..."
        value={connectionUri}
        onChange={(e) => setConnectionUri(e.target.value)}
        rows={3}
      />
    </div>
  </div>
));
AddWalletContent.displayName = 'AddWalletContent';

// Extracted WalletContent to prevent re-renders
const WalletContent = forwardRef<HTMLDivElement, {
  hasWebLN: boolean;
  isDetecting: boolean;
  hasNWC: boolean;
  connections: NWCConnection[];
  connectionInfo: Record<string, NWCInfo>;
  activeConnection: string | null;
  handleSetActive: (cs: string) => void;
  handleRemoveConnection: (cs: string) => void;
  setAddDialogOpen: (open: boolean) => void;
}>(({
  hasWebLN,
  isDetecting,
  hasNWC,
  connections,
  connectionInfo,
  activeConnection,
  handleSetActive,
  handleRemoveConnection,
  setAddDialogOpen
}, ref) => (
  <div className="space-y-6 px-4 pb-4" ref={ref}>
    {/* Current Status */}
    <div className="space-y-3">
      <h3 className="font-medium">Current Status</h3>
      <div className="grid gap-3">
        {/* WebLN */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">WebLN Browser Extension</p>
              <p className="text-xs text-muted-foreground">
                {isDetecting ? 'Detecting...' : hasWebLN ? 'Connected and ready' : 'Not available'}
              </p>
            </div>
          </div>
          <Badge variant={hasWebLN ? "default" : "secondary"} className="text-xs">
            {hasWebLN ? <CheckCircle className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
            {hasWebLN ? 'Connected' : 'Not Found'}
          </Badge>
        </div>

        {/* NWC */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <WalletMinimal className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Nostr Wallet Connect</p>
              <p className="text-xs text-muted-foreground">
                {hasNWC ? `${connections.length} wallet${connections.length !== 1 ? 's' : ''} connected` : 'No wallets connected'}
              </p>
            </div>
          </div>
          <Badge variant={hasNWC ? "default" : "secondary"} className="text-xs">
            {hasNWC ? <CheckCircle className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            {hasNWC ? 'Active' : 'Add Wallet'}
          </Badge>
        </div>
      </div>
    </div>

    {/* NWC Wallets */}
    {connections.length > 0 && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Connected Wallets</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="text-xs h-7"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {connections.map((connection, index) => {
            const info = connectionInfo[connection.connectionString];
            const isActive = activeConnection === connection.connectionString;

            return (
              <div
                key={connection.connectionString}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isActive ? 'ring-1 ring-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-1.5 rounded ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Zap className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {connection.alias || info?.alias || `Wallet ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {connection.isConnected ? 'Ready' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetActive(connection.connectionString)}
                      className="text-xs h-7 px-2"
                    >
                      Use
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveConnection(connection.connectionString)}
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Add First Wallet */}
    {connections.length === 0 && (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
          <WalletMinimal className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium mb-1">No Wallets Connected</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect a Nostr Wallet Connect (NWC) wallet to enable lightning payments.
          </p>
          <Button onClick={() => setAddDialogOpen(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Wallet
          </Button>
        </div>
      </div>
    )}
  </div>
));
WalletContent.displayName = 'WalletContent';

export function WalletModal({ children, className }: WalletModalProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [connectionUri, setConnectionUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const {
    connections,
    activeConnection,
    connectionInfo,
    addConnection,
    removeConnection,
    setActiveConnection,
  } = useNWC();

  const { hasWebLN, hasNWC, isDetecting } = useWallet();

  const handleSetActive = (connectionString: string) => {
    setActiveConnection(connectionString);
    toast({
      title: 'Wallet activated',
      description: 'This wallet will be used for lightning payments.',
    });
  };

  const handleRemoveConnection = (connectionString: string) => {
    removeConnection(connectionString);
  };

  const handleAddWallet = async () => {
    if (!connectionUri.trim()) {
      toast({
        title: 'Connection URI required',
        description: 'Please enter a valid NWC connection string.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);

    try {
      const success = await addConnection(connectionUri.trim(), alias.trim() || undefined);
      if (success) {
        setAlias('');
        setConnectionUri('');
        setAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to add wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const WalletModalContent = () => (
    <>
      <DialogHeader className="px-4 pt-4">
        <DialogTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Settings
        </DialogTitle>
        <DialogDescription>
          Manage your lightning wallet connections for zapping.
        </DialogDescription>
      </DialogHeader>

      <WalletContent
        hasWebLN={hasWebLN}
        isDetecting={isDetecting}
        hasNWC={hasNWC}
        connections={connections}
        connectionInfo={connectionInfo}
        activeConnection={activeConnection}
        handleSetActive={handleSetActive}
        handleRemoveConnection={handleRemoveConnection}
        setAddDialogOpen={setAddDialogOpen}
      />
    </>
  );

  const AddWalletModalContent = () => (
    <>
      <DialogHeader className="px-4 pt-4">
        <DialogTitle>Add Lightning Wallet</DialogTitle>
        <DialogDescription>
          Connect a Nostr Wallet Connect (NWC) compatible wallet.
        </DialogDescription>
      </DialogHeader>

      <AddWalletContent
        alias={alias}
        setAlias={setAlias}
        connectionUri={connectionUri}
        setConnectionUri={setConnectionUri}
      />

      <DialogFooter className="px-4 pb-4">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={() => setAddDialogOpen(false)}
            disabled={isConnecting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddWallet}
            disabled={!connectionUri.trim() || isConnecting}
            className="flex-1"
          >
            {isConnecting ? 'Connecting...' : 'Add Wallet'}
          </Button>
        </div>
      </DialogFooter>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild className={className}>
            {children}
          </DrawerTrigger>
          <DrawerContent className="max-h-[95vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Settings
              </DrawerTitle>
              <DrawerDescription>
                Manage your lightning wallet connections for zapping.
              </DrawerDescription>
            </DrawerHeader>

            <WalletContent
              hasWebLN={hasWebLN}
              isDetecting={isDetecting}
              hasNWC={hasNWC}
              connections={connections}
              connectionInfo={connectionInfo}
              activeConnection={activeConnection}
              handleSetActive={handleSetActive}
              handleRemoveConnection={handleRemoveConnection}
              setAddDialogOpen={setAddDialogOpen}
            />
          </DrawerContent>
        </Drawer>

        {/* Add Wallet Dialog for Mobile */}
        <Drawer open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Add Lightning Wallet</DrawerTitle>
              <DrawerDescription>
                Connect a Nostr Wallet Connect (NWC) compatible wallet.
              </DrawerDescription>
            </DrawerHeader>

            <AddWalletContent
              alias={alias}
              setAlias={setAlias}
              connectionUri={connectionUri}
              setConnectionUri={setConnectionUri}
            />

            <div className="px-4 pb-4">
              <div className="flex gap-2 w-full">
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  onClick={handleAddWallet}
                  disabled={!connectionUri.trim() || isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? 'Connecting...' : 'Add Wallet'}
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild className={className}>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <WalletModalContent />
        </DialogContent>
      </Dialog>

      {/* Add Wallet Dialog for Desktop */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <AddWalletModalContent />
        </DialogContent>
      </Dialog>
    </>
  );
}