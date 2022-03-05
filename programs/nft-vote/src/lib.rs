use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::{pda::find_metadata_account, state::Metadata};

declare_id!("9rJ3xEnJhff2oJgqXzdrHFshgS5QA1PkNFQp4e1vwzp6");

const MAX_TITLE_LEN: usize = 100;

#[program]
pub mod nft_vote {
    use super::*;

    // TODO test for a long long proposal
    pub fn propose(
        ctx: Context<Propose>,
        title: String,
        content: String,
        options: Vec<String>,
        allowed_creators: Vec<Pubkey>,
        ended_at: i64,
    ) -> ProgramResult {
        // check title length
        if title.len() > MAX_TITLE_LEN {
            return Err(ErrorCode::TitleTooLong.into());
        }

        // init proposal
        let proposal = &mut ctx.accounts.proposal;
        proposal.proposer = *ctx.accounts.proposer.key;
        proposal.title = title;
        proposal.content = content;
        proposal.options = options;
        proposal.allowed_creators = allowed_creators;
        proposal.ended_at = ended_at;
        proposal.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }
    pub fn vote(ctx: Context<Vote>, option_idx: u8) -> ProgramResult {
        let now = Clock::get()?.unix_timestamp;
        let proposal = &ctx.accounts.proposal;

        // check is a valid voting time
        require!(proposal.ended_at >= now, ErrorCode::ProposalVotingHasClosed,);

        // check creator is verified
        if proposal.allowed_creators.len() > 0 {
            let metadata = Metadata::from_account_info(&ctx.accounts.metadata.to_account_info())?;
            let mut allowed = false;
            'mainloop: for creator in &metadata.data.creators.unwrap() {
                if !creator.verified {
                    continue;
                }
                for allowed_creator in &proposal.allowed_creators {
                    if &creator.address == allowed_creator {
                        allowed = true;
                        break 'mainloop;
                    }
                }
            }
            require!(allowed, ErrorCode::InvalidMint);
        }

        // init vote record
        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.proposal = ctx.accounts.proposal.key();
        vote_record.mint = ctx.accounts.token_account.mint;
        vote_record.option_idx = option_idx;
        vote_record.created_at = now;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, content: String, options: Vec<String>, allowed_creators: Vec<Pubkey>)]
pub struct Propose<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,
    #[account(
        init,
        payer = proposer,
        space =
            8 +
            32 +
            4 + MAX_TITLE_LEN +
            4 + content.len() +
            4 + options.iter().fold(0, |total, s| total + 4 + s.len()) +
            4 + allowed_creators.iter().fold(0, |total, s| total + 32) +
            8 +
            8
    )]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(option_idx: u8)]
pub struct Vote<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account("&token_account.owner == owner.key", "token_account.amount == 1")]
    pub token_account: Account<'info, TokenAccount>,
    #[account(address = find_metadata_account(&token_account.mint).0)]
    pub metadata: AccountInfo<'info>,
    #[account(mut, "(option_idx as usize) < proposal.options.len()")]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        seeds = [&token_account.mint.to_bytes()[..], &proposal.key().to_bytes()[..]],
        bump,
        payer = owner,
        space = 8 + 32 + 32 + 1 + 8
    )]
    pub vote_record: Account<'info, VoteRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Proposal {
    pub proposer: Pubkey,
    pub title: String,
    pub content: String,
    pub options: Vec<String>,
    pub allowed_creators: Vec<Pubkey>,
    pub ended_at: i64,
    pub created_at: i64,
}

#[account]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub mint: Pubkey,
    pub option_idx: u8,
    pub created_at: i64,
}

#[error]
pub enum ErrorCode {
    #[msg("title should less than or equals to 100")]
    TitleTooLong,
    #[msg("proposal voting has closed")]
    ProposalVotingHasClosed,
    #[msg("invalid mint")]
    InvalidMint,
}
