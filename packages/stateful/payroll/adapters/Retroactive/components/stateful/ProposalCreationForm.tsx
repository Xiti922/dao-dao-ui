import { useWallet } from '@xiti/cosmodal'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useSetRecoilState, waitForAll } from 'recoil'

import { Cw20BaseSelectors, wyndUsdPriceSelector } from '@dao-dao/state/recoil'
import {
  Loader,
  useCachedLoadable,
  useDaoInfoContext,
  useNavHelpers,
} from '@dao-dao/stateless'
import { AmountWithTimestampAndDenom } from '@dao-dao/types'

import { EntityDisplay, SuspenseLoader } from '../../../../../components'
import {
  useDaoProposalSinglePublishProposal,
  useEntity,
} from '../../../../../hooks'
import { NewProposalData } from '../../../../../proposal-module-adapter/adapters/DaoProposalSingle/types'
import { refreshStatusAtom } from '../../atoms'
import { usePostRequest } from '../../hooks/usePostRequest'
import { statusSelector } from '../../selectors'
import { CompleteRatings } from '../../types'
import {
  ProposalCreationFormData,
  ProposalCreationForm as StatelessProposalCreationForm,
} from '../stateless/ProposalCreationForm'

interface ProposalCreationFormProps {
  data: CompleteRatings
}

export const ProposalCreationForm = ({ data }: ProposalCreationFormProps) => {
  const { t } = useTranslation()
  const { goToDaoProposal } = useNavHelpers()
  const { coreAddress, chainId } = useDaoInfoContext()
  const { address: walletAddress = '', publicKey: walletPublicKey } =
    useWallet()

  const postRequest = usePostRequest()

  const statusLoadable = useCachedLoadable(
    walletPublicKey?.hex
      ? statusSelector({
          daoAddress: coreAddress,
          walletPublicKey: walletPublicKey.hex,
        })
      : undefined
  )
  const setRefreshStatus = useSetRecoilState(
    refreshStatusAtom({
      daoAddress: coreAddress,
    })
  )

  const publishProposal = useDaoProposalSinglePublishProposal()

  const [loading, setLoading] = useState(false)
  const onComplete = useCallback(
    async (formData: ProposalCreationFormData) => {
      if (!data) {
        toast.error(t('error.loadingData'))
        return
      }
      if (!publishProposal) {
        toast.error(t('error.noSingleChoiceProposalModule'))
        return
      }

      setLoading(true)

      try {
        // Propose.
        const proposalData: NewProposalData = {
          ...formData,
          msgs: data.cosmosMsgs,
        }

        const { proposalId } = await publishProposal(proposalData)
        toast.success(t('success.proposalCreatedCompleteCompensationCycle'))

        // Complete with proposal ID.
        await postRequest(`/${coreAddress}/complete`, { proposalId })
        toast.success(t('success.compensationCycleCompleted'))

        // Reload status on success.
        setRefreshStatus((id) => id + 1)

        // Navigate to proposal.
        goToDaoProposal(coreAddress, proposalId)

        // Don't stop loading on success since we are now navigating.
      } catch (err) {
        console.error(err)
        toast.error(err instanceof Error ? err.message : JSON.stringify(err))
        setLoading(false)
      }
    },
    [
      data,
      publishProposal,
      t,
      postRequest,
      coreAddress,
      setRefreshStatus,
      goToDaoProposal,
    ]
  )

  const loadingCw20TokenInfos = useCachedLoadable(
    statusLoadable.state === 'hasValue' && statusLoadable.contents
      ? waitForAll(
          statusLoadable.contents.survey.attributes.flatMap(({ cw20Tokens }) =>
            cw20Tokens.map(({ address }) =>
              Cw20BaseSelectors.tokenInfoWithAddressAndLogoSelector({
                contractAddress: address,
                chainId,
                params: [],
              })
            )
          )
        )
      : undefined
  )

  const prices = useCachedLoadable(
    statusLoadable.state === 'hasValue' &&
      statusLoadable.contents &&
      loadingCw20TokenInfos.state === 'hasValue'
      ? waitForAll(
          statusLoadable.contents.survey.attributes.flatMap(
            ({ nativeTokens, cw20Tokens }) => [
              ...nativeTokens.map(({ denom }) => wyndUsdPriceSelector(denom)),
              ...cw20Tokens.map(({ address }) => wyndUsdPriceSelector(address)),
            ]
          )
        )
      : undefined
  )

  const walletEntity = useEntity({
    address: walletAddress,
    chainId,
  })

  return (
    <SuspenseLoader
      fallback={<Loader />}
      forceFallback={
        statusLoadable.state === 'loading' ||
        loadingCw20TokenInfos.state === 'loading' ||
        prices.state === 'loading'
      }
    >
      {statusLoadable.state === 'hasValue' &&
        !!statusLoadable.contents &&
        loadingCw20TokenInfos.state === 'hasValue' &&
        prices.state === 'hasValue' && (
          <StatelessProposalCreationForm
            EntityDisplay={EntityDisplay}
            completeRatings={data}
            cw20TokenInfos={loadingCw20TokenInfos.contents}
            entity={walletEntity}
            loading={loading || statusLoadable.updating}
            onComplete={onComplete}
            prices={
              prices.contents.filter(Boolean) as AmountWithTimestampAndDenom[]
            }
            status={statusLoadable.contents}
            walletAddress={walletAddress}
          />
        )}
    </SuspenseLoader>
  )
}
