import { CodeIdConfig } from '@dao-dao/types'

// https://github.com/DA0-DA0/dao-contracts/releases/tag/v2.0.0-beta
const terpTestnet: CodeIdConfig = {
  Cw20Base: 19, // v0.16
  Cw20Stake: 20,
  Cw4Group: 21, // v0.16
  Cw721Base: 22,
  CwAdminFactory: 23,
  DaoCore: 25,
  DaoPreProposeMultiple: 28,
  DaoPreProposeSingle: 29,
  DaoProposalMultiple: 30,
  DaoProposalSingle: 31,
  DaoVotingCw20Staked: 32,
  DaoVotingCw4: 33,
  DaoVotingCw721Staked: 34,
  DaoVotingNativeStaked: 35,
  CwTokenSwap: 24,
}

// ContractVersion.V2: 2.0.1
const terpMainnet: CodeIdConfig = {
  Cw20Base: 19, // v0.16
  Cw20Stake: 20,
  Cw4Group: 21, // v0.16
  Cw721Base: 22,
  CwAdminFactory: 23,
  DaoCore: 25,
  DaoPreProposeMultiple: 28,
  DaoPreProposeSingle: 29,
  DaoProposalMultiple: 30,
  DaoProposalSingle: 31,
  DaoVotingCw20Staked: 32,
  DaoVotingCw4: 33,
  DaoVotingCw721Staked: 34,
  DaoVotingNativeStaked: 35,
  CwTokenSwap: 24,
}

export const CodeIdConfigs: Record<string, CodeIdConfig | undefined> = {
  'uni-6': terpTestnet,
  'athena-4': terpMainnet,
}
