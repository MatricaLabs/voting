import { FC } from "react";

import MintNFT from "./MintNFT";
import GetAllNFTs from "./GetAllNfts";

export const Mint: FC = () => {
  return (
    <div>
      <MintNFT />
      <GetAllNFTs />
    </div>
  );
};
