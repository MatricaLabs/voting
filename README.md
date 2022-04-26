```           _        _               __       _         
  /\/\   __ _| |_ _ __(_) ___ __ _    / /  __ _| |__  ___ 
 /    \ / _` | __| '__| |/ __/ _` |  / /  / _` | '_ \/ __|
/ /\/\ \ (_| | |_| |  | | (_| (_| | / /__| (_| | |_) \__ \
\/    \/\__,_|\__|_|  |_|\___\__,_| \____/\__,_|_.__/|___/
                                                         
DAO Voting v0.1
``` 

# Architecture

### Proposal
```
    pub client_id: u16,
    pub proposer: Pubkey,
    pub title: String,
    pub content: String,
    pub options: Vec<String>,
    pub allowed_creators: Vec<Pubkey>,
    pub ended_at: i64,
    pub created_at: i64,
```

### Vote
```
    pub proposal: Pubkey,
    pub mint: Pubkey,
    pub option_idx: u8,
    pub created_at: i64,
```


## Creating a contract

1) Call the `propose` function:
https://github.com/MatricaLabs/voting/blob/11ebe037cd6282ae39b116081cda90ad1db49aed/programs/nft-vote/src/lib.rs#L14

2) Use the following input context
https://github.com/MatricaLabs/voting/blob/11ebe037cd6282ae39b116081cda90ad1db49aed/programs/nft-vote/src/lib.rs#L80



## Voting

1) An example implentation can be found in the `/app` folder. To vote on a proposal, see the following example:
https://github.com/MatricaLabs/voting/blob/11ebe037cd6282ae39b116081cda90ad1db49aed/app/src/vote/Vote.tsx#L23


## Token-gating

The contract will allow votes before the end date, who's metadata has a verified creator in the allowedCreators list.

*Note: 
The verified creator many not be enough to distinguish an NFT's collection, even when combined with `updateAuthority`. The brute force method of writing the entire token list to the chain makes creating a contract prohibitively expensive. Ultimately we believe the client application can filter votes off-chain.*

## Votes per transaction
Current maximum is 7 NFT votes per transaction, though we hope to increase this in the future. 

