import { FC } from "react";

import NewProposal from "./NewProposal";
import GetProposalByPubkey from "./GetProposalByPubkey";
import GetProposalByClientId from "./GetProposalByClientId";
import GetAllProposal from "./GetAllProposal";

export const Proposal: FC = () => {
  return (
    <div>
      <NewProposal />
      <GetProposalByPubkey />
      <GetProposalByClientId />
      <GetAllProposal />
    </div>
  );
};
