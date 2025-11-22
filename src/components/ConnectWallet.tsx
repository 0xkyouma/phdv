'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { ID_OF_CHAIN, NAME_OF_CHAIN } from '@/constants/config';

export function ConnectWallet() {

  return (
    <div className="relative z-50">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button
                      type="button"
                      onClick={() => {
                        console.log('Connect button clicked');
                        openConnectModal();
                      }}
                      variant="legendary"
                      className="rounded-full"
                    >
                      Connect Wallet
                    </Button>
                  );
                }

                if (chain?.id !== ID_OF_CHAIN) {
                  return (
                    <Button
                      type="button"
                      onClick={() => {
                        openChainModal();
                      }}
                      variant="danger"
                      className="rounded-full"
                    >
                      Switch to {NAME_OF_CHAIN}
                    </Button>
                  );
                }

                return (
                  <div className="flex items-center gap-2 max-sm:hidden">
                    <Button
                      type="button"
                      onClick={openAccountModal}
                      variant="legendary"
                      className="rounded-full"
                    >
                      {account.displayName}
                    </Button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
