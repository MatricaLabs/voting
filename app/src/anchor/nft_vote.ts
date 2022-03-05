export type NftVote = {
  "version": "0.1.0",
  "name": "nft_vote",
  "instructions": [
    {
      "name": "propose",
      "accounts": [
        {
          "name": "proposer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "options",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "allowedCreators",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "endedAt",
          "type": "i64"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voteRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "optionIdx",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposer",
            "type": "publicKey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "options",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "allowedCreators",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "endedAt",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "optionIdx",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "TitleTooLong",
      "msg": "title should less than or equals to 100"
    },
    {
      "code": 6001,
      "name": "ProposalVotingHasClosed",
      "msg": "proposal voting has closed"
    },
    {
      "code": 6002,
      "name": "InvalidMint",
      "msg": "invalid mint"
    }
  ],
  "metadata": {
    "address": "yJ28bokcTwpT1orZ8yUGPrwYboV46KDDPituAGD7PGe"
  },
};

export const IDL: NftVote = {
  "version": "0.1.0",
  "name": "nft_vote",
  "instructions": [
    {
      "name": "propose",
      "accounts": [
        {
          "name": "proposer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "options",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "allowedCreators",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "endedAt",
          "type": "i64"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voteRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "optionIdx",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposer",
            "type": "publicKey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "options",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "allowedCreators",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "endedAt",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "optionIdx",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "TitleTooLong",
      "msg": "title should less than or equals to 100"
    },
    {
      "code": 6001,
      "name": "ProposalVotingHasClosed",
      "msg": "proposal voting has closed"
    },
    {
      "code": 6002,
      "name": "InvalidMint",
      "msg": "invalid mint"
    }
  ],
  "metadata": {
    "address": "yJ28bokcTwpT1orZ8yUGPrwYboV46KDDPituAGD7PGe",
  },
};
