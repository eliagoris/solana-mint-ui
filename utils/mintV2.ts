import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_SLOT_HASHES_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  ComputeBudgetProgram,
  AccountMeta,
} from "@solana/web3.js"
import { BN } from "bn.js"
import {
  AccountVersion,
  CandyMachine,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-candy-machine-core"
import {
  createMintV2Instruction,
  createRouteInstruction,
  GuardType,
  MintV2InstructionAccounts,
  MintV2InstructionArgs,
  RouteInstructionAccounts,
  RouteInstructionArgs,
  PROGRAM_ID as CANDY_GUARD_PROGRAM_ID,
} from "@metaplex-foundation/mpl-candy-guard"

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import {
  CandyMachine as CandyMachineType,
  DefaultCandyGuardSettings,
  getMerkleProof,
  getMerkleRoot,
  Metaplex,
  MintLimitGuardSettings,
  Option,
  SolPaymentGuardSettings,
  TokenBurnGuardSettings,
} from "@metaplex-foundation/js"
import { u32 } from "@metaplex-foundation/beet"
import allowList from "../allowlist.json"

export const CANDY_MACHINE_PROGRAM = PROGRAM_ID
export const METAPLEX_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
)

/** To mint from the candy guard as a minter */
/** From: https://github.com/metaplex-foundation/mpl-candy-guard/blob/main/js/test/setup/txs-init.ts#L679  */
export async function mintV2Instruction(
  candyGuard: PublicKey,
  candyMachine: PublicKey,
  minter: PublicKey,
  payer: PublicKey,
  mint: Keypair,
  connection: Connection,
  metaplex: Metaplex,
  remainingAccounts?: AccountMeta[] | null,
  mintArgs?: Uint8Array | null,
  label?: string | null
): Promise<{ instructions: TransactionInstruction[] }> {
  // candy machine object
  const candyMachineObject = await CandyMachine.fromAccountAddress(
    connection,
    candyMachine
  )

  const nftMetadata = metaplex.nfts().pdas().metadata({ mint: mint.publicKey })
  const nftMasterEdition = metaplex
    .nfts()
    .pdas()
    .masterEdition({ mint: mint.publicKey })
  const nftTokenAccount = metaplex
    .tokens()
    .pdas()
    .associatedTokenAccount({ mint: mint.publicKey, owner: minter })

  const authorityPda = metaplex
    .candyMachines()
    .pdas()
    .authority({ candyMachine })

  const collectionMint = candyMachineObject.collectionMint
  // retrieves the collection nft
  const collection = await metaplex
    .nfts()
    .findByMint({ mintAddress: collectionMint })
  // collection PDAs
  const collectionMetadata = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: collectionMint })
  const collectionMasterEdition = metaplex
    .nfts()
    .pdas()
    .masterEdition({ mint: collectionMint })

  const collectionDelegateRecord = metaplex
    .nfts()
    .pdas()
    .metadataDelegateRecord({
      mint: collectionMint,
      type: "CollectionV1",
      updateAuthority: collection.updateAuthorityAddress,
      delegate: authorityPda,
    })

  const accounts: MintV2InstructionAccounts = {
    candyGuard,
    candyMachineProgram: CANDY_MACHINE_PROGRAM,
    candyMachine,
    payer: payer,
    minter: minter,
    candyMachineAuthorityPda: authorityPda,
    nftMasterEdition: nftMasterEdition,
    nftMetadata,
    nftMint: mint.publicKey,
    nftMintAuthority: payer,
    token: nftTokenAccount,
    collectionUpdateAuthority: collection.updateAuthorityAddress,
    collectionDelegateRecord,
    collectionMasterEdition,
    collectionMetadata,
    collectionMint,
    tokenMetadataProgram: METAPLEX_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    splTokenProgram: TOKEN_PROGRAM_ID,
    splAtaProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    recentSlothashes: SYSVAR_SLOT_HASHES_PUBKEY,
  }

  if (candyMachineObject.version == AccountVersion.V2) {
    accounts.tokenRecord = metaplex
      .nfts()
      .pdas()
      .tokenRecord({ mint: mint.publicKey, token: nftTokenAccount })
  }

  if (!mintArgs) {
    mintArgs = new Uint8Array()
  }

  const args: MintV2InstructionArgs = {
    mintArgs,
    label: label ?? null,
  }

  const ixs: TransactionInstruction[] = []

  const mintIx = createMintV2Instruction(accounts, args)
  // this test always initializes the mint, we we need to set the
  // account to be writable and a signer to avoid warnings
  for (let i = 0; i < mintIx.keys.length; i++) {
    if (mintIx.keys[i].pubkey.toBase58() === mint.publicKey.toBase58()) {
      mintIx.keys[i].isSigner = true
      mintIx.keys[i].isWritable = true
    }
  }

  if (remainingAccounts) {
    mintIx.keys.push(...remainingAccounts)
  }

  const data = Buffer.from(
    Uint8Array.of(
      0,
      ...new BN(600000).toArray("le", 4),
      ...new BN(0).toArray("le", 4)
    )
  )

  const additionalComputeIx: TransactionInstruction =
    new TransactionInstruction({
      keys: [],
      programId: ComputeBudgetProgram.programId,
      data,
    })

  ixs.push(additionalComputeIx)
  ixs.push(mintIx)

  return { instructions: ixs }
}

/**
 * Returns remaining accounts by Candy Guard type.
 * Some Guards doesn't require remaining accounts, so in this case it will return an empty array.
 */
export const getRemainingAccountsByGuardType = ({
  candyMachine,
  payer,
  guard,
  guardType,
}: {
  candyMachine: CandyMachineType<DefaultCandyGuardSettings>
  payer: PublicKey
  guard: Option<SolPaymentGuardSettings | object>
  guardType: string
}) => {
  const remainingAccs: {
    [key: string]: () => {
      accounts?: AccountMeta[]
      ixs?: TransactionInstruction[]
    }
  } = {
    startDate: () => {
      // start date is default
      return {}
    },
    solPayment: () => {
      const solPaymentGuard = guard as SolPaymentGuardSettings

      return {
        accounts: [
          {
            pubkey: solPaymentGuard.destination,
            isSigner: false,
            isWritable: true,
          },
        ],
      }
    },
    allowList: () => {
      if (!candyMachine.candyGuard) return {}

      const accounts: RouteInstructionAccounts = {
        candyGuard: candyMachine.candyGuard.address,
        candyMachine: candyMachine.address,
        payer,
      }

      const merkleRoot = getMerkleRoot(allowList)
      const validMerkleProof = getMerkleProof(allowList, payer.toString())

      const vectorSizeBuffer = Buffer.alloc(4)
      u32.write(vectorSizeBuffer, 0, validMerkleProof.length)

      // prepares the mint arguments with the merkle proof
      const mintArgs = Buffer.concat([vectorSizeBuffer, ...validMerkleProof])

      const args: RouteInstructionArgs = {
        args: {
          guard: GuardType.AllowList,
          data: mintArgs,
        },
        label: null,
      }

      const [proofPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("allow_list"),
          merkleRoot,
          payer.toBuffer(),
          candyMachine.candyGuard.address.toBuffer(),
          candyMachine.address.toBuffer(),
        ],
        CANDY_GUARD_PROGRAM_ID
      )

      const routeIx = createRouteInstruction(accounts, args)
      routeIx.keys.push(
        ...[
          {
            pubkey: proofPda,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ]
      )

      const remainingAccounts = [
        {
          pubkey: proofPda,
          isSigner: false,
          isWritable: false,
        },
      ]

      return { ixs: [routeIx], accounts: remainingAccounts }
    },
    mintLimit: () => {
      if (!candyMachine.candyGuard) return {}
      const mintLimitGuard = guard as MintLimitGuardSettings

      const [mintCounterPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_limit"),
          new Uint8Array([mintLimitGuard.id]),
          payer.toBuffer(),
          candyMachine.candyGuard?.address.toBuffer(),
          candyMachine.address.toBuffer(),
        ],
        CANDY_GUARD_PROGRAM_ID
      )

      return {
        accounts: [
          {
            pubkey: mintCounterPda,
            isSigner: false,
            isWritable: true,
          },
        ],
      }
    },
    tokenBurn: () => {
      if (!candyMachine.candyGuard) return {}
      const tokenBurnGuard = guard as TokenBurnGuardSettings
      const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
      )

      const [mintBurnPda] = PublicKey.findProgramAddressSync(
        [
          payer.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenBurnGuard.mint.toBuffer(),
        ],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      )

      return {
        accounts: [
          {
            pubkey: mintBurnPda,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: tokenBurnGuard.mint,
            isSigner: false,
            isWritable: true,
          },
        ],
      }
    },
  }

  if (!remainingAccs[guardType]) {
    console.warn(
      "Couldn't find remaining accounts for Guard " +
        guardType +
        ". This can most likely cause the mint tx to fail."
    )

    return {}
  }

  return remainingAccs[guardType]()
}

export const getRemainingAccountsForCandyGuard = (
  candyMachine: CandyMachineType<DefaultCandyGuardSettings>,
  payer: PublicKey
) => {
  if (!candyMachine.candyGuard) return {}

  const { guards } = candyMachine.candyGuard

  /** Filter only enabled Guards */
  const enabledGuardsKeys =
    guards && Object.keys(guards).filter((guardKey) => guards[guardKey])

  let remainingAccounts: AccountMeta[] = []
  let additionalIxs: TransactionInstruction[] = []
  if (enabledGuardsKeys.length) {
    /** Map all Guards and grab their remaining accounts */
    enabledGuardsKeys.forEach((guardKey) => {
      const guardObject = candyMachine.candyGuard?.guards[guardKey]

      if (!guardObject) return null

      console.log(`Setting up ${guardKey} Guard...`)
      const { accounts, ixs } = getRemainingAccountsByGuardType({
        candyMachine,
        payer,
        guard: guardObject,
        guardType: guardKey,
      })

      /** Push to the accounts array */
      if (accounts && accounts.length) {
        remainingAccounts.push(...accounts)
      }

      /** Push to the ixs array */
      if (ixs && ixs.length) {
        additionalIxs.push(...ixs)
      }
    })
  }

  return { remainingAccounts, additionalIxs }
}
