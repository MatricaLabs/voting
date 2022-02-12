use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use std::str::FromStr;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod nft_vote {
    use super::*;

    pub fn add_nft(ctx: Context<AddNFT>, _bump: u8, weight: u8) -> ProgramResult {
        // init nft info
        let nft_info = &mut ctx.accounts.nft_info;
        nft_info.weight = weight;

        Ok(())
    }

    // TODO test for a long long proposal
    pub fn propose(
        ctx: Context<Propose>,
        title: String,
        content: String,
        options: Vec<String>,
    ) -> ProgramResult {
        // init proposal
        let proposal = &mut ctx.accounts.proposal;
        proposal.proposer = *ctx.accounts.proposer.key;
        proposal.title = title;
        proposal.content = content;
        proposal.votes = vec![0; options.len()];
        proposal.options = options;
        proposal.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _bump: u8, option_idx: u8) -> ProgramResult {
        // init vote record
        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.option_idx = option_idx;
        vote_record.created_at = Clock::get()?.unix_timestamp;

        // vote
        let proposal = &mut ctx.accounts.proposal;
        proposal.votes[option_idx as usize] += ctx.accounts.nft_info.weight as u64;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct AddNFT<'info> {
    #[account(mut, address = Pubkey::from_str("HpWLog4FwZpKcm3qR27iZXN59spcXH497SK4vD9VdwS7").unwrap() @ ErrorCode::OnlyAdmin)]
    pub admin: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(init, seeds = [&mint.key().to_bytes()[..]], bump = bump, payer = admin, space = 8 + 1)]
    pub nft_info: Account<'info, NftInfo>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, content: String, options: Vec<String>)]
pub struct Propose<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,
    #[account(
        init,
        payer = proposer,
        space =
            8 +
            32 +
            4 + title.len() +
            4 + content.len() +
            4 + options.iter().fold(0, |total, s| total + 4 + s.len()) +
            4 + (options.len() * 8) +
            8
    )]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8, option_idx: u8)]
pub struct Vote<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account("&token_account.owner == owner.key", "token_account.amount == 1")]
    pub token_account: Account<'info, TokenAccount>,
    #[account(address = Pubkey::find_program_address(&[&token_account.mint.to_bytes()], &id()).0)]
    pub nft_info: Account<'info, NftInfo>,
    #[account(mut, "(option_idx as usize) < proposal.options.len()")]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        seeds = [&token_account.mint.to_bytes()[..], &proposal.key().to_bytes()[..]],
        bump = bump,
        payer = owner,
        space =
            8 +
            1 +
            8
    )]
    pub vote_record: Account<'info, VoteRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NftInfo {
    pub weight: u8,
}

#[account]
pub struct Proposal {
    pub proposer: Pubkey,
    pub title: String,
    pub content: String,
    pub options: Vec<String>,
    pub votes: Vec<u64>,
    pub created_at: i64,
}

#[account]
pub struct VoteRecord {
    pub option_idx: u8,
    pub created_at: i64,
}

#[error]
pub enum ErrorCode {
    #[msg("only admin")]
    OnlyAdmin,
}
