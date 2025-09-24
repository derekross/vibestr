import { useState, useEffect, useRef, forwardRef } from 'react';
import { Zap, Copy, Check, ExternalLink, Sparkle, Sparkles, Star, Rocket, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Event } from 'nostr-tools';
import QRCode from 'qrcode';

interface ZapDialogProps {
  target: Event;
  children?: React.ReactNode;
  className?: string;
}

const presetAmounts = [
  { amount: 1, icon: Sparkle },
  { amount: 50, icon: Sparkles },
  { amount: 100, icon: Zap },
  { amount: 250, icon: Star },
  { amount: 1000, icon: Rocket },
];

interface ZapContentProps {
  invoice: string | null;
  amount: number | string;
  comment: string;
  isZapping: boolean;
  qrCodeUrl: string;
  copied: boolean;
  hasWebLN: boolean;
  handleZap: () => void;
  handleCopy: () => void;
  openInWallet: () => void;
  setAmount: (amount: number | string) => void;
  setComment: (comment: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  zap: (amount: number, comment: string) => void;
}

// Moved ZapContent outside of ZapDialog to prevent re-renders causing focus loss
const ZapContent = forwardRef<HTMLDivElement, ZapContentProps>(({
  invoice,
  amount,
  comment,
  isZapping,
  qrCodeUrl,
  copied,
  hasWebLN,
  handleZap,
  handleCopy,
  openInWallet,
  setAmount,
  setComment,
  inputRef,
  zap,
}, ref) => (
  <div ref={ref}>
    {invoice ? (
      <div className="flex flex-col h-full min-h-0">
        {/* Payment amount display */}
        <div className="text-center pt-4">
          <div className="text-2xl font-bold">{amount} sats</div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col justify-center min-h-0 flex-1 px-2">
          {/* QR Code */}
          <div className="flex justify-center">
            <Card className="p-3 [@media(max-height:680px)]:max-w-[65vw] max-w-[95vw] mx-auto">
              <CardContent className="p-0 flex justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Lightning Invoice QR Code"
                    className="w-full h-auto aspect-square max-w-full object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted animate-pulse rounded" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice input */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="invoice">Lightning Invoice</Label>
            <div className="flex gap-2 min-w-0">
              <Input
                id="invoice"
                value={invoice}
                readOnly
                className="font-mono text-xs min-w-0 flex-1 overflow-hidden text-ellipsis"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="space-y-3 mt-4">
            {hasWebLN && (
              <Button
                onClick={() => {
                  const finalAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
                  zap(finalAmount, comment);
                }}
                disabled={isZapping}
                className="w-full"
                size="lg"
              >
                {isZapping ? 'Paying...' : 'Pay with WebLN'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={openInWallet}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Wallet
            </Button>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-6 px-4 pb-4">
        {/* Amount Selection */}
        <div className="space-y-3">
          <Label htmlFor="amount">Amount (sats)</Label>
          <div className="space-y-3">
            <ToggleGroup
              type="single"
              value={amount.toString()}
              onValueChange={(value) => value && setAmount(parseInt(value))}
              className="grid grid-cols-5 gap-2"
            >
              {presetAmounts.map(({ amount: presetAmount, icon: Icon }) => (
                <ToggleGroupItem
                  key={presetAmount}
                  value={presetAmount.toString()}
                  className="flex flex-col gap-1 h-16 text-xs"
                  aria-label={`${presetAmount} sats`}
                >
                  <Icon className="h-4 w-4" />
                  {presetAmount}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Input
              ref={inputRef}
              id="amount"
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              className="w-full"
            />
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-3">
          <Label htmlFor="comment">Message (optional)</Label>
          <Textarea
            id="comment"
            placeholder="Say something nice..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <div className="text-xs text-muted-foreground text-right">
            {comment.length}/500
          </div>
        </div>

        {/* Zap Button */}
        <Button
          onClick={handleZap}
          disabled={!amount || amount === '0' || isZapping}
          className="w-full"
          size="lg"
        >
          <Zap className="h-4 w-4 mr-2" />
          {isZapping ? 'Creating Invoice...' : `Zap ${amount || 0} sats`}
        </Button>
      </div>
    )}
  </div>
));
ZapContent.displayName = 'ZapContent';

export function ZapDialog({ target, children, className }: ZapDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>(100);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target?.pubkey || '');
  const { webln, activeNWC } = useWallet();

  const { zap, isZapping, invoice, resetInvoice } = useZaps(
    target,
    webln,
    activeNWC,
    () => setOpen(false)
  );

  // Generate QR code when invoice changes
  useEffect(() => {
    if (invoice) {
      QRCode.toDataURL(`lightning:${invoice}`, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(''));
    } else {
      setQrCodeUrl('');
    }
  }, [invoice]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAmount(100);
      setComment('');
      setCopied(false);
      resetInvoice();
    }
  }, [open, resetInvoice]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!invoice) return;

    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Invoice copied to clipboard.',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Open in wallet app
  const openInWallet = () => {
    if (invoice) {
      window.open(`lightning:${invoice}`, '_blank');
    }
  };

  // Handle zap action
  const handleZap = async () => {
    const finalAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    if (finalAmount > 0) {
      await zap(finalAmount, comment);
    }
  };

  // Don't render if user not logged in or is the author
  if (!user || !target || user.pubkey === target.pubkey) {
    return null;
  }

  // Don't render if author has no lightning address
  if (!author?.metadata?.lud16 && !author?.metadata?.lud06) {
    return null;
  }

  const displayName = author?.metadata?.name || 'Anonymous';

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild className={className}>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {invoice ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetInvoice();
                      setQrCodeUrl('');
                    }}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  Pay Invoice
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Zap {displayName}
                </>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {invoice ?
                'Scan the QR code or copy the invoice to pay with your lightning wallet.' :
                'Send sats to show your appreciation.'
              }
            </DrawerDescription>
          </DrawerHeader>

          <ZapContent
            invoice={invoice}
            amount={amount}
            comment={comment}
            isZapping={isZapping}
            qrCodeUrl={qrCodeUrl}
            copied={copied}
            hasWebLN={!!webln}
            handleZap={handleZap}
            handleCopy={handleCopy}
            openInWallet={openInWallet}
            setAmount={setAmount}
            setComment={setComment}
            inputRef={inputRef}
            zap={zap}
          />

          {invoice && (
            <div className="px-4 pb-4">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </DrawerClose>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {invoice ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetInvoice();
                    setQrCodeUrl('');
                  }}
                  className="p-1 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Pay Invoice
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Zap {displayName}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {invoice ?
              'Scan the QR code or copy the invoice to pay with your lightning wallet.' :
              'Send sats to show your appreciation.'
            }
          </DialogDescription>
        </DialogHeader>

        <ZapContent
          invoice={invoice}
          amount={amount}
          comment={comment}
          isZapping={isZapping}
          qrCodeUrl={qrCodeUrl}
          copied={copied}
          hasWebLN={!!webln}
          handleZap={handleZap}
          handleCopy={handleCopy}
          openInWallet={openInWallet}
          setAmount={setAmount}
          setComment={setComment}
          inputRef={inputRef}
          zap={zap}
        />
      </DialogContent>
    </Dialog>
  );
}