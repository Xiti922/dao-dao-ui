import { useWallet } from '@xiti/cosmodal'
import { useTranslation } from 'react-i18next'

import { KadoModal } from '@dao-dao/stateless'
import { KadoModalProps, ModalProps } from '@dao-dao/types'

export const WalletFiatRampModal = (
  props: Omit<ModalProps, 'header'> & Pick<KadoModalProps, 'defaultMode'>
) => {
  const { t } = useTranslation()
  const { address } = useWallet()

  return (
    <KadoModal
      header={{
        title: t('title.fiatOnOffRamp'),
        subtitle: t('info.fiatOnOffRampDescription'),
      }}
      toAddress={
        // Don't prefill address when selling since it's only relevant when
        // buying.
        props.defaultMode === 'sell' ? undefined : address
      }
      {...props}
    />
  )
}
