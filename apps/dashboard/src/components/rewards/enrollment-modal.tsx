'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAccount, useConnect, useSignMessage, useDisconnect as useEVMDisconnect, useConnectors } from 'wagmi';
import { signAndEnroll } from '@/lib/solana/verification';
import { signAndEnrollEVM } from '@/lib/evm/verification';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';

type ChainType = 'solana' | 'evm';

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = 'idle' | 'connecting' | 'signing' | 'success' | 'error';

export function EnrollmentModal({ open, onOpenChange }: EnrollmentModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chainType, setChainType] = useState<ChainType>('solana');

  // Solana wallet hooks
  const wallet = useWallet();
  const { publicKey, connected, disconnect } = wallet;
  const { setVisible } = useWalletModal();
  const { refetchRewardsStatus } = useAuth();

  // EVM wallet hooks
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { connect: evmConnect } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { disconnect: evmDisconnect } = useEVMDisconnect();
  const connectors = useConnectors();

  // Handle Solana wallet connection and automatic signing
  useEffect(() => {
    if (status === 'connecting' && chainType === 'solana' && connected && publicKey) {
      // Wallet connected, proceed to signing
      handleSign();
    }
  }, [connected, publicKey, status, chainType]);

  // Handle EVM wallet connection and automatic signing
  useEffect(() => {
    if (status === 'connecting' && chainType === 'evm' && evmConnected && evmAddress) {
      handleEVMSign();
    }
  }, [evmConnected, evmAddress, status, chainType]);

  const handleConnect = useCallback(() => {
    setStatus('connecting');
    setErrorMessage(null);
    setVisible(true);
  }, [setVisible]);

  const handleSign = useCallback(async () => {
    setStatus('signing');
    setErrorMessage(null);

    const result = await signAndEnroll(wallet);

    if (result.success) {
      await refetchRewardsStatus();
      setStatus('success');
    } else {
      setErrorMessage(result.error || 'Failed to verify address');
      setStatus('error');
    }
  }, [wallet, refetchRewardsStatus]);

  const handleEVMSign = useCallback(async () => {
    if (!evmAddress) return;
    setStatus('signing');
    setErrorMessage(null);

    const result = await signAndEnrollEVM(signMessageAsync, evmAddress);

    if (result.success) {
      await refetchRewardsStatus();
      setStatus('success');
    } else {
      setErrorMessage(result.error || 'Failed to verify address');
      setStatus('error');
    }
  }, [evmAddress, signMessageAsync, refetchRewardsStatus]);

  const handleTryAgain = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    disconnect();
    evmDisconnect();
  }, [disconnect, evmDisconnect]);

  const handleAddAnother = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    disconnect();
    evmDisconnect();
  }, [disconnect, evmDisconnect]);

  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setStatus('idle');
      setErrorMessage(null);
      disconnect();
      evmDisconnect();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, disconnect, evmDisconnect]);

  const handleDone = useCallback(() => {
    handleClose(false);
  }, [handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register Pay-To Address</DialogTitle>
          <DialogDescription>
            Connect your pay-to wallet to start tracking volume for rewards.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {status === 'idle' && (
            <>
              {/* Chain selector */}
              <div className="flex gap-2 mb-6 w-full">
                <Button
                  variant={chainType === 'solana' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChainType('solana')}
                  className="flex-1"
                >
                  Solana
                </Button>
                <Button
                  variant={chainType === 'evm' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChainType('evm')}
                  className="flex-1"
                >
                  EVM
                </Button>
              </div>

              <div className="mb-6 p-4 rounded-full bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Connect your pay-to wallet and sign a message to verify ownership.
                {chainType === 'solana' ? ' This will not cost any SOL.' : ' This will not cost any ETH.'}
              </p>

              {/* Solana wallet connect */}
              {chainType === 'solana' && (
                <Button onClick={handleConnect} className="w-full">
                  Connect Wallet
                </Button>
              )}

              {/* EVM wallet connectors */}
              {chainType === 'evm' && (
                <div className="flex flex-col gap-2 w-full">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      variant="outline"
                      onClick={() => {
                        setStatus('connecting');
                        evmConnect({ connector });
                      }}
                    >
                      {connector.name}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}

          {status === 'connecting' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                Connecting wallet...
              </p>
            </>
          )}

          {status === 'signing' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                Please sign the message in your wallet...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Address Added!</h3>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Your volume will now be tracked for this address.
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={handleAddAnother} className="flex-1">
                  Add Another
                </Button>
                <Button onClick={handleDone} className="flex-1">
                  Done
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verification Failed</h3>
              <p className="text-center text-sm text-red-600 dark:text-red-400 mb-6">
                {errorMessage}
              </p>
              <Button onClick={handleTryAgain} className="w-full">
                Try Again
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
