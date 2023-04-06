To setup a Candy Machine:

- Create your Candy Machine using [Sugar](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1) (now supports pNFTs)
- Change token standard to pNFT: `sugar config set -t pnft`
- Make sure you have setup your [Candy Guard](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1#candy-guards---further-configuration). _This is a necessary step._

After these, you can use this UI to mint pNFTs.

## Candy Guards supported

- Start date
- [Sol Payment](https://docs.metaplex.com/programs/candy-machine/available-guards/sol-payment)
- [Allow List](https://docs.metaplex.com/programs/candy-machine/available-guards/allow-list)
  - Grab your Merkle Root from [here](https://tools.key-strokes.com/merkle-root)
  - Add the Merkle Root to your Sugar config.json:
    ```
        "allowList": {
            "merkleRoot": "e889dfa8fbfb6016378348ca395f243c55a0768647c2ca58e5febffa17e02d60"
        },
    ```
  - Add your allow list wallets to the `allowlist.json` file
- [Mint Limit](https://docs.metaplex.com/programs/candy-machine/available-guards/mint-limit)

## develop locally

- `yarn`

- `yarn dev`
