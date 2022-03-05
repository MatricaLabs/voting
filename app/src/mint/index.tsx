import React, { FC, useCallback, useState } from "react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";
import { Creator, DataV2, CreateMetadataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { programs } from "@metaplex/js";

export const Mint: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const [mintStatus, setMintStatus] = useState("");

  const onClick = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    try {
      let mint = Keypair.generate();
      let ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        publicKey
      );

      const metadataPubkey = await programs.metadata.Metadata.getPDA(mint.publicKey);
      const metadataData = new DataV2({
        name: "Test",
        symbol: "",
        uri: "",
        sellerFeeBasisPoints: 100,
        creators: [new Creator({ address: publicKey.toBase58(), verified: true, share: 100 })],
        collection: null,
        uses: null,
      });
      let createMetadataTx = new CreateMetadataV2(
        {
          feePayer: publicKey,
        },
        {
          metadata: metadataPubkey,
          metadataData: metadataData,
          updateAuthority: publicKey,
          mint: mint.publicKey,
          mintAuthority: publicKey,
        }
      );

      let tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await Token.getMinBalanceRentForExemptMint(connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(TOKEN_PROGRAM_ID, mint.publicKey, 0, publicKey, publicKey),
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          ata,
          publicKey,
          publicKey
        ),
        Token.createMintToInstruction(TOKEN_PROGRAM_ID, mint.publicKey, ata, publicKey, [], 1),
        createMetadataTx.instructions[0]
      );
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.feePayer = publicKey;
      tx.partialSign(mint);

      if (!signTransaction) {
        throw new Error("signTransaction is not a function");
      }
      let signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "processed");

      setMintStatus(`mint: ${mint.publicKey.toBase58()}`);
    } catch (e) {
      console.log(e);
    }
  }, [publicKey, signTransaction, connection]);

  return (
    <div>
      <button onClick={onClick} disabled={!publicKey}>
        create a new mint to vote
      </button>
      {mintStatus ? <p>{mintStatus}</p> : <></>}
    </div>
  );
};
