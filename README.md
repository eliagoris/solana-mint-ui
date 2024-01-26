## How to set up a Candy Machine:

- Create your Candy Machine using [Sugar](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1) (now supports pNFTs)
- Change token standard to pNFT: `sugar config set -t pnft` (optional)
- Make sure you have setup your [Candy Guard](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1#candy-guards---further-configuration). _This is a necessary step._

After these, you can use this UI to mint NFTs from your Candy Machine.

> _Make sure to add your environment variables by copying the contents from the `.env.template` file into a new `.env` file. If you use Vercel, add them to your project environment variables._

## Candy Guards supported

Mostly candy guards, as they're currently being handled automatically. There are no additional steps, but if your mint is not working, try contacting me.

## develop locally

- `yarn`

- Copy and fill the contents from the `.env.template` file into a `.env` file.

- `yarn dev`

## deploy

You can deploy to any provider but make sure you add the `NEXT_PUBLIC_CANDY_MACHINE_ID` environment variable. (_Try [Vercel](https://vercel.com/new)_)

## If you like this, donate

- Send tips in SOL to help me build in public: 52zEuaG5VBQTzRP7MLMyEzSuKgYPF9E9dtaWrmXaiNkg
