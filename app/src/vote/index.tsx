import { FC } from "react";

import VoteButton from "./Vote";
import GetAllVotes from "./GetAllVotes";
import GetVotesByProposal from "./GetVotesByProposal";

export const Vote: FC = () => {
  return (
    <div>
      <VoteButton />
      <GetAllVotes />
      <GetVotesByProposal />
    </div>
  );
};
