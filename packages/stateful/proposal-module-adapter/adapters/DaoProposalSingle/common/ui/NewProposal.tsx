import {
  Close,
  GavelRounded,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import { WalletConnectionStatus, useWallet } from '@xiti/cosmodal'
import clsx from 'clsx'
import Fuse from 'fuse.js'
import cloneDeep from 'lodash.clonedeep'
import { useCallback, useState } from 'react'
import {
  SubmitErrorHandler,
  SubmitHandler,
  useFieldArray,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import TimeAgo from 'react-timeago'

import {
  ActionCardLoader,
  ActionSelector,
  Button,
  CosmosMessageDisplay,
  FilterableItem,
  FilterableItemPopup,
  IconButton,
  InputErrorMessage,
  ProposalContentDisplay,
  TextAreaInput,
  TextInput,
  Tooltip,
} from '@dao-dao/stateless'
import { Action, BaseNewProposalProps, LoadedActions } from '@dao-dao/types'
import { CosmosMsgFor_Empty } from '@dao-dao/types/contracts/common'
import {
  decodedMessagesString,
  formatDateTime,
  formatTime,
  processError,
  validateRequired,
} from '@dao-dao/utils'

import { SuspenseLoader } from '../../../../../components/SuspenseLoader'
import { useWalletInfo } from '../../../../../hooks'
import { NewProposalData, NewProposalForm } from '../../types'

enum ProposeSubmitValue {
  Preview = 'Preview',
  Submit = 'Submit',
}

export interface NewProposalProps
  extends Pick<
    BaseNewProposalProps<NewProposalForm>,
    | 'draft'
    | 'saveDraft'
    | 'drafts'
    | 'loadDraft'
    | 'unloadDraft'
    | 'draftSaving'
    | 'deleteDraft'
  > {
  createProposal: (newProposalData: NewProposalData) => Promise<void>
  loading: boolean
  isPaused: boolean
  isMember: boolean
  anyoneCanPropose: boolean
  depositUnsatisfied: boolean
  connected: boolean
  actions: Action[]
  loadedActions: LoadedActions
  simulationBypassExpiration?: Date
}

export const NewProposal = ({
  createProposal,
  loading,
  isPaused,
  isMember,
  anyoneCanPropose,
  depositUnsatisfied,
  connected,
  actions,
  loadedActions,
  draft,
  saveDraft,
  drafts,
  loadDraft,
  unloadDraft,
  draftSaving,
  deleteDraft,
  simulationBypassExpiration,
}: NewProposalProps) => {
  const { t } = useTranslation()

  // Unpack here because we use these at the top level as well as
  // inside of nested components.
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    resetField,
  } = useFormContext<NewProposalForm>()

  const [showPreview, setShowPreview] = useState(false)
  const [showSubmitErrorNote, setShowSubmitErrorNote] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { status: walletStatus } = useWallet()
  const { walletAddress = '', walletProfileData } = useWalletInfo()

  const proposalDescription = watch('description')
  const proposalTitle = watch('title')

  const {
    fields: actionDataFields,
    append: appendAction,
    remove: removeAction,
  } = useFieldArray({
    name: 'actionData',
    control,
    shouldUnregister: true,
  })

  const onSubmitForm: SubmitHandler<NewProposalForm> = useCallback(
    ({ actionData, ...data }, event) => {
      setShowSubmitErrorNote(false)
      setSubmitError('')

      const nativeEvent = event?.nativeEvent as SubmitEvent
      const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

      if (submitterValue === ProposeSubmitValue.Preview) {
        setShowPreview((p) => !p)
        return
      }

      let msgs
      try {
        msgs = actionData
          .map(({ key, data }) => loadedActions[key]?.transform(data))
          // Filter out undefined messages.
          .filter(Boolean) as CosmosMsgFor_Empty[]
      } catch (err) {
        console.error(err)
        setSubmitError(
          processError(err, {
            forceCapture: false,
          })
        )
        return
      }

      createProposal({
        ...data,
        msgs,
      })
    },
    [createProposal, loadedActions]
  )

  const onSubmitError: SubmitErrorHandler<NewProposalForm> = useCallback(
    () => setShowSubmitErrorNote(true),
    [setShowSubmitErrorNote]
  )

  const proposalName = watch('title')

  return (
    <form onSubmit={handleSubmit(onSubmitForm, onSubmitError)}>
      <div className="rounded-lg bg-background-tertiary">
        <div className="flex flex-row items-center justify-between gap-6 border-b border-border-secondary py-4 px-6">
          <p className="primary-text text-text-body">
            {t('form.proposalsName')}
          </p>

          <div className="flex grow flex-col">
            <TextInput
              error={errors.title}
              fieldName="title"
              placeholder={t('form.proposalsNamePlaceholder')}
              register={register}
              validation={[validateRequired]}
            />
            <InputErrorMessage error={errors.title} />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6 pt-5">
          <p className="primary-text text-text-body">
            {t('form.description')}
            <span className="text-text-tertiary">
              {/* eslint-disable-next-line i18next/no-literal-string */}
              {' – '}
              {t('info.supportsMarkdownFormat')}
            </span>
          </p>

          <div className="flex flex-col">
            <TextAreaInput
              error={errors.description}
              fieldName="description"
              placeholder={t('form.proposalsDescriptionPlaceholder')}
              register={register}
              rows={5}
              validation={[validateRequired]}
            />
            <InputErrorMessage error={errors.description} />
          </div>
        </div>
      </div>

      <p className="title-text my-6 text-text-body">
        {t('title.actions', { count: actionDataFields.length })}
      </p>

      {actionDataFields.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {actionDataFields.map(({ id, key, data }, index) => {
            const Component = loadedActions[key]?.action?.Component
            if (!Component) {
              return null
            }

            return (
              <SuspenseLoader key={id} fallback={<ActionCardLoader />}>
                <Component
                  addAction={appendAction}
                  allActionsWithData={actionDataFields}
                  data={data}
                  errors={errors.actionData?.[index]?.data || {}}
                  fieldNamePrefix={`actionData.${index}.data.`}
                  index={index}
                  isCreating
                  onRemove={() => {
                    // Reset the data field to avoid stale data. Honestly not
                    // sure why this has to happen; I figured the `remove` call
                    // would do this automatically. Some actions, like Execute
                    // Smart Contract, don't seem to need this, while others,
                    // like the Token Swap actions, do.
                    resetField(`actionData.${index}.data`, {
                      defaultValue: {},
                    })
                    // Remove the action.
                    removeAction(index)
                  }}
                />
              </SuspenseLoader>
            )
          })}
        </div>
      )}

      <ActionSelector
        actions={actions}
        onSelectAction={({ key }) => {
          appendAction({
            key,
            // Clone to prevent the form from mutating the original object.
            data: cloneDeep(loadedActions[key]?.defaults ?? {}),
          })
        }}
      />

      <div className="mt-6 flex flex-col gap-2 border-y border-border-secondary py-6">
        <div className="flex flex-row items-center justify-between gap-6">
          <p className="title-text text-text-body">
            {t('info.reviewYourProposal')}
          </p>

          <div className="flex flex-row items-center justify-end gap-2">
            <Button
              disabled={loading}
              type="submit"
              value={ProposeSubmitValue.Preview}
              variant="secondary"
            >
              {showPreview ? (
                <>
                  {t('button.hidePreview')}
                  <VisibilityOff className="!h-5 !w-5" />
                </>
              ) : (
                <>
                  {t('button.preview')}
                  <Visibility className="!h-5 !w-5" />
                </>
              )}
            </Button>

            <Tooltip
              title={
                !connected
                  ? t('error.connectWalletToContinue')
                  : depositUnsatisfied
                  ? t('error.notEnoughForDeposit')
                  : isPaused
                  ? t('error.daoIsPaused')
                  : undefined
              }
            >
              <Button
                disabled={
                  !connected ||
                  (!anyoneCanPropose && !isMember) ||
                  depositUnsatisfied ||
                  isPaused
                }
                loading={loading}
                type="submit"
                value={ProposeSubmitValue.Submit}
              >
                <p>
                  {simulationBypassExpiration ? (
                    // If bypassing simulation, change button label and show a
                    // countdown until simulation bypass expires.
                    <TimeAgo
                      date={simulationBypassExpiration}
                      formatter={(value, _, suffix) =>
                        suffix === 'from now'
                          ? t('button.publishAnywayWithCountdown', {
                              secondsRemaining: value,
                            })
                          : // In case the countdown expires before the re-render,
                            // just show the original button label.
                            t('button.publish')
                      }
                    />
                  ) : (
                    t('button.publish')
                  )}
                </p>
                <GavelRounded className="!h-4 !w-4" />
              </Button>
            </Tooltip>
          </div>
        </div>

        {!anyoneCanPropose &&
          !isMember &&
          walletStatus !== WalletConnectionStatus.Initializing &&
          walletStatus !== WalletConnectionStatus.AttemptingAutoConnection &&
          walletStatus !== WalletConnectionStatus.Connecting && (
            <p className="secondary-text max-w-prose self-end text-right text-text-interactive-error">
              {t('error.mustBeMemberToCreateProposal')}
            </p>
          )}

        {simulationBypassExpiration && (
          <p className="secondary-text max-w-prose self-end text-right text-text-interactive-warning-body">
            {t('info.bypassSimulationExplanation')}
          </p>
        )}

        {showSubmitErrorNote && (
          <p className="secondary-text self-end text-right text-text-interactive-error">
            {t('error.createProposalSubmitInvalid')}
          </p>
        )}

        {!!submitError && (
          <p className="secondary-text self-end text-right text-text-interactive-error">
            {submitError}
          </p>
        )}

        {showPreview && (
          <div className="mt-4 rounded-md border border-border-secondary p-6">
            <ProposalContentDisplay
              actionDisplay={
                actionDataFields.length ? (
                  <CosmosMessageDisplay
                    value={decodedMessagesString(
                      actionDataFields
                        .map(({ key, data }) => {
                          try {
                            return loadedActions[key]?.transform(data)
                          } catch (err) {
                            console.error(err)
                          }
                        })
                        // Filter out undefined messages.
                        .filter(Boolean) as CosmosMsgFor_Empty[]
                    )}
                  />
                ) : undefined
              }
              createdAt={new Date()}
              creator={{
                address: walletAddress,
                name: walletProfileData.loading
                  ? { loading: true }
                  : { loading: false, data: walletProfileData.profile.name },
              }}
              description={proposalDescription}
              title={proposalTitle}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-row items-center justify-end gap-2">
        {draft ? (
          <>
            <p
              className={clsx(
                'caption-text italic',
                draftSaving && 'animate-pulse'
              )}
            >
              {draftSaving
                ? t('info.draftSaving')
                : t('info.draftSavedAtTime', {
                    time: formatTime(new Date(draft.lastUpdatedAt)),
                  })}
            </p>

            <Tooltip
              title={draftSaving ? undefined : t('info.draftStillSaved')}
            >
              <Button
                className="caption-text -ml-1"
                disabled={draftSaving}
                onClick={unloadDraft}
                variant="underline"
              >
                {t('button.resetQuestion')}
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            {drafts.length > 0 && (
              <FilterableItemPopup
                Trigger={({ open, ...props }) => (
                  <Button pressed={open} variant="secondary" {...props}>
                    {t('button.loadDraft')}
                  </Button>
                )}
                filterableItemKeys={FILTERABLE_KEYS}
                items={drafts.map(
                  ({ name, createdAt, lastUpdatedAt }, index) => ({
                    key: createdAt,
                    label: name,
                    description: (
                      <>
                        {t('title.created')}:{' '}
                        {formatDateTime(new Date(createdAt))}
                        <br />
                        {t('title.lastUpdated')}:{' '}
                        {formatDateTime(new Date(lastUpdatedAt))}
                      </>
                    ),
                    rightNode: (
                      <Tooltip title={t('button.deleteDraft')}>
                        <IconButton
                          Icon={Close}
                          onClick={(event) => {
                            // Don't click on item button.
                            event.stopPropagation()
                            deleteDraft(index)
                          }}
                          variant="ghost"
                        />
                      </Tooltip>
                    ),
                  })
                )}
                onSelect={(_, index) => loadDraft(index)}
                searchPlaceholder={t('info.searchDraftPlaceholder')}
              />
            )}

            <Tooltip
              title={
                proposalName ? undefined : t('info.enterNameBeforeSavingDraft')
              }
            >
              <Button
                disabled={!proposalName}
                onClick={saveDraft}
                variant="secondary"
              >
                {t('button.saveDraft')}
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    </form>
  )
}

const FILTERABLE_KEYS: Fuse.FuseOptionKey<FilterableItem>[] = ['label']
