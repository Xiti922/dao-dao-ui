import { Check, Close } from '@mui/icons-material'
import JSON5 from 'json5'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  AddressInput,
  Button,
  CodeMirrorInput,
  FormSwitchCard,
  InputErrorMessage,
  InputLabel,
  NumberInput,
  SelectInput,
  SwordsEmoji,
} from '@dao-dao/stateless'
import { GenericTokenBalance, TokenType } from '@dao-dao/types'
import { ActionComponent } from '@dao-dao/types/actions'
import {
  NATIVE_DENOM,
  convertMicroDenomToDenomWithDecimals,
  makeWasmMessage,
  validateContractAddress,
  validateCosmosMsg,
  validatePositive,
  validateRequired,
} from '@dao-dao/utils'

import { ActionCard } from './ActionCard'
import {
  NativeCoinSelector,
  NativeCoinSelectorProps,
} from './NativeCoinSelector'

export interface ExecuteData {
  address: string
  message: string
  funds: { denom: string; amount: number }[]
  // Whether or not we're executing via a CW20 send.
  cw20: boolean
}

export interface ExecuteOptions {
  balances: GenericTokenBalance[]
  // Only present once executed.
  instantiatedAddress?: string
}

export const ExecuteComponent: ActionComponent<ExecuteOptions> = (props) => {
  const { t } = useTranslation()
  const { fieldNamePrefix, onRemove, errors, isCreating } = props
  const { register, control, watch, setValue } = useFormContext()
  const {
    fields: coins,
    append: appendCoin,
    remove: removeCoin,
  } = useFieldArray({
    control,
    name: fieldNamePrefix + 'funds',
  })

  const cw20Tokens = props.options.balances.filter(
    ({ token }) => token.type === TokenType.Cw20
  )
  const cw20 = watch(fieldNamePrefix + 'cw20') as boolean
  const firstDenom = (
    watch(fieldNamePrefix + 'funds.0') as ExecuteData['funds'][0] | undefined
  )?.denom
  const selectedCw20 = props.options.balances.find(
    ({ token }) => token.denomOrAddress === firstDenom
  )

  return (
    <ActionCard
      Icon={SwordsEmoji}
      onRemove={onRemove}
      title={t('title.executeSmartContract')}
    >
      <div className="flex flex-col items-stretch gap-1">
        <InputLabel name={t('form.smartContractAddress')} />
        <AddressInput
          disabled={!isCreating}
          error={errors?.address}
          fieldName={fieldNamePrefix + 'address'}
          register={register}
          type="contract"
          validation={[validateRequired, validateContractAddress]}
        />
        <InputErrorMessage error={errors?.address} />
      </div>

      <div className="flex flex-col items-stretch gap-1">
        <InputLabel name={t('form.message')} />
        <CodeMirrorInput
          control={control}
          error={errors?.message}
          fieldName={fieldNamePrefix + 'message'}
          readOnly={!isCreating}
          validation={[
            (v: string) => {
              let msg
              try {
                msg = JSON5.parse(v)
              } catch (err) {
                return err instanceof Error ? err.message : `${err}`
              }
              msg = makeWasmMessage({
                wasm: {
                  execute: {
                    contract_addr: '',
                    funds: [],
                    msg,
                  },
                },
              })
              return (
                validateCosmosMsg(msg).valid || t('error.invalidExecuteMessage')
              )
            },
          ]}
        />

        {errors?.message ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-text-interactive-error">
            <Close className="!h-5 !w-5" />{' '}
            <span>{errors.message.message}</span>
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1 text-sm text-text-interactive-valid">
            <Check className="!h-5 !w-5" /> {t('info.jsonIsValid')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <InputLabel name={t('form.funds')} />

        <div className="flex flex-row items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            {cw20 ? (
              <div className="flex grow flex-row items-stretch gap-2">
                <NumberInput
                  containerClassName="grow"
                  disabled={!isCreating}
                  error={errors?.funds?.[0]?.amount}
                  fieldName={fieldNamePrefix + 'funds.0.amount'}
                  max={convertMicroDenomToDenomWithDecimals(
                    selectedCw20?.balance ?? 0,
                    selectedCw20?.token.decimals ?? 0
                  )}
                  min={convertMicroDenomToDenomWithDecimals(
                    1,
                    selectedCw20?.token.decimals ?? 0
                  )}
                  register={register}
                  setValue={setValue}
                  sizing="auto"
                  step={convertMicroDenomToDenomWithDecimals(
                    1,
                    selectedCw20?.token.decimals ?? 0
                  )}
                  validation={[validateRequired, validatePositive]}
                  watch={watch}
                />

                <SelectInput
                  defaultValue={cw20Tokens[0]?.token.denomOrAddress}
                  disabled={!isCreating}
                  error={errors?.funds?.[0]?.denom}
                  fieldName={fieldNamePrefix + 'funds.0.denom'}
                  register={register}
                  style={{ maxWidth: '8.2rem' }}
                >
                  {cw20Tokens.map(({ token: { denomOrAddress, symbol } }) => (
                    <option key={denomOrAddress} value={denomOrAddress}>
                      ${symbol}
                    </option>
                  ))}
                </SelectInput>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-2">
                {coins.map(({ id }, index) => (
                  <NativeCoinSelector
                    key={id}
                    {...({
                      ...props,
                      options: {
                        nativeBalances: props.options.balances.filter(
                          ({ token }) => token.type === TokenType.Native
                        ),
                      },
                      onRemove: props.isCreating
                        ? () => removeCoin(index)
                        : undefined,
                    } as NativeCoinSelectorProps)}
                    errors={errors?.funds?.[index]}
                    fieldNamePrefix={fieldNamePrefix + `funds.${index}.`}
                  />
                ))}
                {!isCreating && coins.length === 0 && (
                  <p className="mt-1 mb-2 text-xs italic text-text-tertiary">
                    {t('info.none')}
                  </p>
                )}
                {isCreating && (
                  <Button
                    className="self-start"
                    onClick={() =>
                      appendCoin({ amount: 1, denom: NATIVE_DENOM })
                    }
                    variant="secondary"
                  >
                    {t('button.addPayment')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {isCreating && (
            <FormSwitchCard
              fieldName={fieldNamePrefix + 'cw20'}
              label={t('form.useCw20')}
              onToggle={() => setValue(fieldNamePrefix + 'funds', [])}
              readOnly={!isCreating}
              setValue={setValue}
              sizing="sm"
              tooltip={t('form.useCw20ExecuteTooltip')}
              value={watch(fieldNamePrefix + 'cw20')}
            />
          )}
        </div>
      </div>
    </ActionCard>
  )
}
