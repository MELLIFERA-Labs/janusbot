import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

export function convertOptionToVoteType(option: VoteOption | undefined) {
  switch (option) {
    case VoteOption.VOTE_OPTION_YES:
      return 'yes';
    case VoteOption.VOTE_OPTION_NO:
      return 'no';
    case VoteOption.VOTE_OPTION_NO_WITH_VETO:
      return 'no_with_veto';
    case VoteOption.VOTE_OPTION_ABSTAIN:
      return 'abstain';
    default:
      return null;
  }
}
export function convertTypeToVote(type: string) {
  switch (type) {
    case 'yes':
      return VoteOption.VOTE_OPTION_YES;
    case 'no':
      return VoteOption.VOTE_OPTION_NO;
    case 'no_with_veto':
      return VoteOption.VOTE_OPTION_NO_WITH_VETO;
    case 'abstain':
      return VoteOption.VOTE_OPTION_ABSTAIN;
    default:
      throw new Error('invalid type');
  }
}
