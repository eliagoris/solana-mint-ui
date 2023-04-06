To setup a Candy Machine:

- Create your Candy Machine using [Sugar](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1) (now supports pNFTs)
- Change token standard to pNFT: `sugar config set -t pnft`
- Make sure you have setup your [Candy Guard](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1#candy-guards---further-configuration). _This is a necessary step._

After these, you can use this UI to mint pNFTs.

## Candy Guards supported

- Start date
- SOL payment
- Allowlist
  - Add your allow list to the `allowlist.json` file

## develop locally

- `yarn`

- `yarn dev`
