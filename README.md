# solana-mint-ui

⚛️ Up to date mint UI for NFTs on Solana. Works with the latest version of Candy Machine and pNFTs.

⚡ Zero additional dependencies besides Nextjs, Metaplex & Solana. Build your own UI from scratch =)

## How to set up a Candy Machine:

- Create your Candy Machine. Recommend using [Sugar](https://developers.metaplex.com/candy-machine/sugar/installation) (now supports pNFTs)
- Change token standard to pNFT: `sugar config set -t pnft` (optional)
- Make sure you have set up your Candy Guards. [Candy Guards on Sugar](https://developers.metaplex.com/candy-machine/sugar/commands/guard). _This is a necessary step._

After these, you can use this UI to mint NFTs from your Candy Machine.

> _Make sure to add your environment variables by copying the contents from the `.env.template` file into a new `.env` file. If you use Vercel, add them to your project environment variables._

## Candy Guards supported

Mostly candy guards, as they're currently being handled automatically. There are no additional steps, but if your mint is not working, try contacting me.

## develop locally

- `yarn` or `npm install`

- Copy and fill the contents from the `.env.template` file into a `.env` file.

- `yarn dev` or `npm run dev`

## deploy

You can deploy to any provider but make sure you add the environment variables from `.env.template`. (_Try [Vercel](https://vercel.com/new)_)

## If you like this, donate

- Send tips in SOL to help me build in public: 52zEuaG5VBQTzRP7MLMyEzSuKgYPF9E9dtaWrmXaiNkg
