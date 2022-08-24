import { mountedInBrowserAtom } from '@dao-dao/state'
import { DecoratorFn } from '@storybook/react'
import { RecoilRoot } from 'recoil'

export const RecoilDecorator: DecoratorFn = (Story) => (
  <RecoilRoot initializeState={({ set }) => {
    set(mountedInBrowserAtom, true)
  }}>
    <Story />
  </RecoilRoot>
)
