import Head from "next/head"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import {
  CandyMachine,
  Metaplex,
  PublicKey,
  walletAdapterIdentity,
  MintFromCandyMachineBuilderParams,
  BigNumberValues,
  SplTokenAmount,
  toBigNumber,
  Signer,
  TransactionBuilder,
} from "@metaplex-foundation/js"
import { token as tokenAmount } from "@metaplex-foundation/js/dist/types/types/Amount"
import { createMintV2Instruction } from "@metaplex-foundation/mpl-candy-guard"
import {
  Keypair,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_SLOT_HASHES_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js"

const mintTxBuilder = async (
  metaplex: Metaplex,
  params: MintFromCandyMachineBuilderParams
) => {
  const payer = metaplex.rpc().getDefaultFeePayer()

  const {
    candyMachine,
    collectionUpdateAuthority,
    mintAuthority = metaplex.identity(),
    mint = Keypair.generate(),
    owner = payer.publicKey,
    group = null,
    guards = {},
    token,
  } = params

  const programs = undefined

  // Programs.
  const candyMachineProgram = metaplex.programs().getCandyMachine(programs)
  const candyGuardProgram = metaplex.programs().getCandyGuard(programs)
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs)
  const tokenProgram = metaplex.programs().getToken(programs)
  const systemProgram = metaplex.programs().getSystem(programs)

  // PDAs.
  const authorityPda = metaplex.candyMachines().pdas().authority({
    candyMachine: candyMachine.address,
    programs,
  })
  const nftMetadata = metaplex.nfts().pdas().metadata({
    mint: mint.publicKey,
    programs,
  })
  const nftMasterEdition = metaplex.nfts().pdas().masterEdition({
    mint: mint.publicKey,
    programs,
  })
  const collectionMetadata = metaplex.nfts().pdas().metadata({
    mint: candyMachine.collectionMintAddress,
    programs,
  })
  const collectionMasterEdition = metaplex.nfts().pdas().masterEdition({
    mint: candyMachine.collectionMintAddress,
    programs,
  })
  const collectionAuthorityRecord = metaplex
    .nfts()
    .pdas()
    .collectionAuthorityRecord({
      mint: candyMachine.collectionMintAddress,
      collectionAuthority: authorityPda,
      programs,
    })

  // Transaction Builder that prepares the mint and token accounts.
  const tokenWithMintBuilder = await metaplex
    .tokens()
    .builders()
    .createTokenWithMint(
      {
        decimals: 0,
        initialSupply: tokenAmount(1),
        mint,
        mintAuthority: payer,
        freezeAuthority: payer.publicKey,
        owner,
        token,
        createMintAccountInstructionKey: params.createMintAccountInstructionKey,
        initializeMintInstructionKey: params.initializeMintInstructionKey,
        createAssociatedTokenAccountInstructionKey:
          params.createAssociatedTokenAccountInstructionKey,
        createTokenAccountInstructionKey:
          params.createTokenAccountInstructionKey,
        initializeTokenInstructionKey: params.initializeTokenInstructionKey,
        mintTokensInstructionKey: params.mintTokensInstructionKey,
      },
      { payer, programs }
    )
  const { tokenAddress } = tokenWithMintBuilder.getContext()

  // Shared mint accounts
  const sharedMintAccounts = {
    candyMachine: candyMachine.address,
    payer: payer.publicKey,
    nftMetadata,
    nftMint: mint.publicKey,
    nftMintAuthority: payer.publicKey,
    nftMasterEdition,
    collectionAuthorityRecord,
    collectionMint: candyMachine.collectionMintAddress,
    collectionMetadata,
    collectionMasterEdition,
    collectionUpdateAuthority,
    candyMachineProgram: candyMachineProgram.address,
    tokenMetadataProgram: tokenMetadataProgram.address,
    tokenProgram: tokenProgram.address,
    systemProgram: systemProgram.address,
    recentSlothashes: SYSVAR_SLOT_HASHES_PUBKEY,
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
  }

  // Mint instruction.
  let mintNftInstruction: TransactionInstruction
  let mintNftSigners: Signer[]
  if (!!candyMachine.candyGuard) {
    const { candyGuard } = candyMachine
    const guardClient = metaplex.candyMachines().guards()
    const parsedMintSettings = guardClient.parseMintSettings(
      candyMachine.address,
      candyGuard,
      owner,
      payer,
      mint,
      guards,
      group,
      programs
    )

    mintNftSigners = [payer, mint, ...parsedMintSettings.signers]
    mintNftInstruction = createMintFromGuardInstruction(
      {
        ...sharedMintAccounts,
        candyGuard: candyMachine.candyGuard.address,
        candyMachineAuthorityPda: authorityPda,
      },
      {
        mintArgs: parsedMintSettings.arguments,
        label: group,
      },
      candyGuardProgram.address
    )
    mintNftInstruction.keys.push(...parsedMintSettings.accountMetas)
  } else {
    mintNftSigners = [payer, mint, mintAuthority]
    mintNftInstruction = createMintFromMachineInstruction(
      {
        ...sharedMintAccounts,
        authorityPda,
        mintAuthority: mintAuthority.publicKey,
      },
      candyMachineProgram.address
    )
  }

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)
      .setContext({ tokenAddress, mintSigner: mint })

      // Create token and mint accounts.
      .add(tokenWithMintBuilder)

      // Mint the new NFT.
      .add({
        instruction: mintNftInstruction,
        signers: mintNftSigners,
        key: params.mintFromCandyMachineInstructionKey ?? "mintNft",
      })
  )
}

export default function Home() {
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null)
  const [candyMachine, setCandyMachine] = useState<CandyMachine | null>(null)

  useEffect(() => {
    ;(async () => {
      if (wallet && connection) {
        const metaplex = new Metaplex(connection).use(
          walletAdapterIdentity(wallet)
        )
        setMetaplex(metaplex)

        const candyMachine = await metaplex.candyMachines().findByAddress({
          address: new PublicKey(
            "BfiCWycLconSDfem9nrSt7qYCKdmMztnehTdyrGaW23S"
          ),
        })

        setMetaplex(metaplex)
        setCandyMachine(candyMachine)

        console.log(candyMachine)
      }
    })()
  }, [wallet, connection])
  return (
    <>
      <Head>
        <title>pNFTs mint</title>
        <meta name="description" content="Mint pNFTs from the UI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 0",
        }}
      >
        <h1>pNFTs mint</h1>
        <p>mint pNFTs from the ui</p>

        <WalletMultiButton
          style={{
            backgroundColor: "#121212",
            border: "1px solid #00ffbd",
            borderColor: "#00ffbd",
            fontSize: "16px",
          }}
        />
        <button
          onClick={async () => {
            if (!metaplex || !candyMachine) return null

            await metaplex
              .candyMachines()
              .builders()

              .mint({
                candyMachine,
                collectionUpdateAuthority: candyMachine.authorityAddress,
              })
          }}
        >
          mint
        </button>
      </main>
    </>
  )
}
