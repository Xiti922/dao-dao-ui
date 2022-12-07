import { Code, Wallet } from '@mui/icons-material'
import clsx from 'clsx'
import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  ComponentType,
} from 'react'
import {
  FieldError,
  FieldPathValue,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormWatch,
  Validate,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { StatefulProfileDisplayProps } from '@dao-dao/types'
import { CHAIN_BECH32_PREFIX, isValidAddress } from '@dao-dao/utils'

export interface AddressInputProps<
  FV extends FieldValues,
  FieldName extends Path<FV>
> extends Omit<ComponentPropsWithoutRef<'input'>, 'required'> {
  fieldName: FieldName
  register: UseFormRegister<FV>
  watch?: UseFormWatch<FV>
  onChange?: ChangeEventHandler<HTMLInputElement>
  validation?: Validate<FieldPathValue<FV, FieldName>>[]
  error?: FieldError | string
  disabled?: boolean
  required?: boolean
  containerClassName?: string
  iconType?: 'wallet' | 'contract'
  ProfileDisplay?: ComponentType<StatefulProfileDisplayProps>
}

export const AddressInput = <
  FV extends FieldValues,
  FieldName extends Path<FV>
>({
  fieldName,
  register,
  watch: _watch,
  error,
  validation,
  onChange,
  disabled,
  required,
  className,
  containerClassName,
  iconType = 'wallet',
  ProfileDisplay,
  ...rest
}: AddressInputProps<FV, FieldName>) => {
  const { t } = useTranslation()
  const validate = validation?.reduce(
    (a, v) => ({ ...a, [v.toString()]: v }),
    {}
  )

  const Icon = iconType === 'wallet' ? Wallet : Code

  // Null if not within a FormProvider.
  const formContext = useFormContext<FV>()
  const watch = _watch || formContext?.watch
  const formValue = watch?.(fieldName)

  const showProfile =
    ProfileDisplay &&
    !!formValue &&
    isValidAddress(formValue, CHAIN_BECH32_PREFIX)

  return (
    <div
      className={clsx(
        'secondary-text flex items-center gap-2 rounded-md bg-transparent py-3 px-4 font-mono text-sm ring-1 transition focus-within:outline-none focus-within:ring-2',
        error
          ? 'ring-border-interactive-error'
          : 'ring-border-primary focus:ring-border-interactive-focus',
        containerClassName
      )}
    >
      {(disabled && showProfile) || (
        <>
          <Icon className="!h-5 !w-5" />
          <input
            className={clsx(
              'ring-none body-text w-full border-none bg-transparent outline-none',
              className
            )}
            disabled={disabled}
            placeholder={t('form.address')}
            type="text"
            {...rest}
            {...register(fieldName, {
              required: required && 'Required',
              validate,
              onChange,
            })}
          />
        </>
      )}
      {showProfile && (
        <div className={clsx(disabled || 'pl-4')}>
          <ProfileDisplay address={formValue} />
        </div>
      )}
    </div>
  )
}
