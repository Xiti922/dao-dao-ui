import { useWallet } from '@xiti/cosmodal'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilValue } from 'recoil'

import {
  blockHeightSelector,
  blocksPerYearSelector,
  stakingLoadingAtom,
} from '@dao-dao/state'
import { useCachedLoadable, useDaoInfoContext } from '@dao-dao/stateless'
import {
  BaseProfileCardMemberInfoProps,
  UnstakingTask,
  UnstakingTaskStatus,
} from '@dao-dao/types'
import {
  convertExpirationToDate,
  convertMicroDenomToDenomWithDecimals,
  durationToSeconds,
  processError,
} from '@dao-dao/utils'

import {
  DaoVotingNativeStakedHooks,
  useAwaitNextBlock,
  useWalletInfo,
} from '../../../../hooks'
import { ProfileCardMemberInfoTokens } from '../../../components'
import { useVotingModuleAdapterOptions } from '../../../react/context'
import { useGovernanceTokenInfo, useStakingInfo } from '../hooks'
import { StakingModal } from './StakingModal'

export const ProfileCardMemberInfo = ({
  maxGovernanceTokenDeposit,
  ...props
}: BaseProfileCardMemberInfoProps) => {
  const { t } = useTranslation()
  const { name: daoName } = useDaoInfoContext()
  const { address: walletAddress, connected } = useWallet()
  const { refreshBalances } = useWalletInfo()
  const { votingModuleAddress } = useVotingModuleAdapterOptions()

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [claimingLoading, setClaimingLoading] = useState(false)
  const stakingLoading = useRecoilValue(stakingLoadingAtom)

  const {
    governanceTokenInfo,
    token,
    loadingWalletBalance: loadingUnstakedBalance,
  } = useGovernanceTokenInfo({
    fetchWalletBalance: true,
  })

  const {
    unstakingDuration,
    refreshTotals,
    claimsPending,
    claimsAvailable,
    sumClaimsAvailable,
    loadingWalletStakedValue,
    loadingTotalStakedValue,
    refreshClaims,
  } = useStakingInfo({
    fetchClaims: true,
    fetchWalletStakedValue: true,
    fetchTotalStakedValue: true,
  })

  if (
    loadingUnstakedBalance === undefined ||
    loadingWalletStakedValue === undefined ||
    loadingTotalStakedValue === undefined
  ) {
    throw new Error(t('error.loadingData'))
  }

  const doClaim = DaoVotingNativeStakedHooks.useClaim({
    contractAddress: votingModuleAddress,
    sender: walletAddress ?? '',
  })

  const awaitNextBlock = useAwaitNextBlock()
  const onClaim = useCallback(async () => {
    if (!connected) {
      return toast.error(t('error.connectWalletToContinue'))
    }
    if (!sumClaimsAvailable) {
      return toast.error(t('error.noClaimsAvailable'))
    }

    setClaimingLoading(true)
    try {
      await doClaim()

      // New balances will not appear until the next block.
      await awaitNextBlock()

      refreshBalances()
      refreshTotals()
      refreshClaims?.()

      toast.success(
        `Claimed ${convertMicroDenomToDenomWithDecimals(
          sumClaimsAvailable,
          governanceTokenInfo.decimals
        ).toLocaleString(undefined, {
          maximumFractionDigits: governanceTokenInfo.decimals,
        })} $${governanceTokenInfo.symbol}`
      )
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setClaimingLoading(false)
    }
  }, [
    awaitNextBlock,
    connected,
    doClaim,
    governanceTokenInfo.decimals,
    governanceTokenInfo.symbol,
    refreshBalances,
    refreshClaims,
    refreshTotals,
    sumClaimsAvailable,
    t,
  ])

  const blockHeightLoadable = useCachedLoadable(blockHeightSelector({}))
  const blocksPerYear = useRecoilValue(blocksPerYearSelector({}))

  const unstakingTasks: UnstakingTask[] = [
    ...(claimsPending ?? []).map(({ amount, release_at }) => ({
      token,
      status: UnstakingTaskStatus.Unstaking,
      amount: convertMicroDenomToDenomWithDecimals(
        amount,
        governanceTokenInfo.decimals
      ),
      date: convertExpirationToDate(
        blocksPerYear,
        release_at,
        blockHeightLoadable.state === 'hasValue'
          ? blockHeightLoadable.contents
          : 0
      ),
    })),
    ...(claimsAvailable ?? []).map(({ amount, release_at }) => ({
      token,
      status: UnstakingTaskStatus.ReadyToClaim,
      amount: convertMicroDenomToDenomWithDecimals(
        amount,
        governanceTokenInfo.decimals
      ),
      date: convertExpirationToDate(
        blocksPerYear,
        release_at,
        blockHeightLoadable.state === 'hasValue'
          ? blockHeightLoadable.contents
          : 0
      ),
    })),
  ]

  return (
    <>
      {showStakingModal && (
        <StakingModal
          maxDeposit={maxGovernanceTokenDeposit}
          onClose={() => setShowStakingModal(false)}
        />
      )}

      <ProfileCardMemberInfoTokens
        claimingLoading={claimingLoading}
        daoName={daoName}
        loadingStakedTokens={
          loadingWalletStakedValue.loading
            ? { loading: true }
            : {
                loading: false,
                data: convertMicroDenomToDenomWithDecimals(
                  loadingWalletStakedValue.data,
                  governanceTokenInfo.decimals
                ),
              }
        }
        loadingUnstakedTokens={
          loadingUnstakedBalance.loading
            ? { loading: true }
            : {
                loading: false,
                data: convertMicroDenomToDenomWithDecimals(
                  loadingUnstakedBalance.data,
                  governanceTokenInfo.decimals
                ),
              }
        }
        loadingVotingPower={
          loadingWalletStakedValue.loading || loadingTotalStakedValue.loading
            ? { loading: true }
            : {
                loading: false,
                data:
                  (loadingWalletStakedValue.data /
                    loadingTotalStakedValue.data) *
                  100,
              }
        }
        onClaim={onClaim}
        onStake={() => setShowStakingModal(true)}
        refreshUnstakingTasks={() => refreshClaims?.()}
        stakingLoading={stakingLoading}
        tokenDecimals={governanceTokenInfo.decimals}
        tokenSymbol={governanceTokenInfo.symbol}
        unstakingDurationSeconds={
          (unstakingDuration &&
            durationToSeconds(blocksPerYear, unstakingDuration)) ||
          undefined
        }
        unstakingTasks={unstakingTasks}
        {...props}
      />
    </>
  )
}
