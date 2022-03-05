import { FC } from "react";

import NewProposal from "./NewProposal";
import GetProposalByPubkey from "./GetProposalByPubkey";
import GetAllProposal from "./GetAllProposal";

export const Proposal: FC = () => {
  return (
    <div>
      <NewProposal />
      <GetProposalByPubkey />
      <GetAllProposal />
    </div>
  );
};
