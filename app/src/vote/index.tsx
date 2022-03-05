import { FC } from "react";

import VoteButton from "./Vote";
import GetAllVotes from "./GetAllVotes";

export const Vote: FC = () => {
  return (
    <div>
      <VoteButton />
      <GetAllVotes />
    </div>
  );
};
