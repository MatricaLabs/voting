// import {IDL, idl from "./nft_vote.json";
import { IDL, NftVote } from "./nft_vote";
import { Program, Provider, Idl, web3 } from "@project-serum/anchor";
import { Connection } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export const programID = new web3.PublicKey(IDL.metadata.address);

export function getProgram(connection: Connection, wallet: AnchorWallet): Program<NftVote> {
  // @ts-ignore
  return new Program(IDL as Idl, programID, new Provider(connection, wallet, {})) as Program<NftVote>;
}
