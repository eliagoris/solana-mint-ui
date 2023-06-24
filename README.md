To setup a Candy Machine:

- Create your Candy Machine using [Sugar](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1) (now supports pNFTs)
- Change token standard to pNFT: `sugar config set -t pnft`
- Make sure you have setup your [Candy Guard](https://docs.metaplex.com/programs/candy-machine/how-to-guides/my-first-candy-machine-part1#candy-guards---further-configuration). _This is a necessary step._

After these, you can use this UI to mint pNFTs.

## Candy Guards supported

- [Start date](https://docs.metaplex.com/programs/candy-machine/available-guards/start-date)
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
- [Token Burn](https://docs.metaplex.com/programs/candy-machine/available-guards/token-burn)

## develop locally

- `yarn`

- Copy and fill the contents from the `.env.template` file into a `.env` file.

- `yarn dev`

## deploy

You can deploy to any provider but make sure you add the `NEXT_PUBLIC_CANDY_MACHINE_ID` environment variable. (_Try [Vercel](https://vercel.com/new)_)

## contribute

You can build guards, or improve the UI, and your PR will be happily reviewed & merged.

Also, I'm accepting tips in SOL to keep improving this open-source project: 52zEuaG5VBQTzRP7MLMyEzSuKgYPF9E9dtaWrmXaiNkg

# Setup your own cmui

You'll need to modify a few things to make this work for your own candymachine on mainnet. <b>Be careful tho, there's no edit undo</b>.<br><br>
Start by changing your `example.env` to `.env`. <b>Proceed with Caution!</b><br><br>
Head over to [Quicknode](https://www.quicknode.com/) and get setup with a free account.

Create an endpoint<br><br>
![rpc-start](https://media.discordapp.net/attachments/1051281685234327613/1120493098221457509/rpc-start.png?width=884&height=330)
<br><br>
Select Solana<br><br>
![rpc-solana](https://media.discordapp.net/attachments/1051281685234327613/1120493098590552145/rpc-solana.png?width=600&height=330)
<br><br>
Select mainnet-beta <b>Proceed with caution</b><br><br>
![rpc-mainnet](https://media.discordapp.net/attachments/1051281685234327613/1120493098909306950/rpc-mainnet.png)
<br><br>
Create your endpoint<br><br>
![rpc-create](https://media.discordapp.net/attachments/1051281685234327613/1120493099160981604/rpc-create.png?width=540&height=330)
<br><br>
Select your RPC<br><br>
![rpc-yours](https://media.discordapp.net/attachments/1051281685234327613/1120495297659936768/rpc-yours.png)
<br><br>
Copy the address<br><br>
![rpc-copy](https://media.discordapp.net/attachments/1051281685234327613/1120495297353756682/rpc-copy.png?width=768&height=330)
<br><br>
Paste it into your `.env` file, where it says RPC<br><br>
![rpc-paste](https://media.discordapp.net/attachments/1051281685234327613/1120496971443097690/image.png?width=932&height=259)
<br><br>
(Modify the rest of those contents in your `.env` as well.)
<br><br>
Navigate to `/components/WalletProvider.tsx` and paste your RPC endpoint url in line 18, where the curser lies in the screenshot below.<br><br>
![rpc-paste2](https://media.discordapp.net/attachments/1051281685234327613/1120498024444071966/rpc-paste2.png?width=932&height=248)
<br><br>
<b>Update your `favicon.ico`</b><br><br>
Use [remove.bg](https://remove.bg) to create a PNG of your logo, download and rename the file to `favicon.ico`. Delete the existing `favicon.ico` in the `/public/` folder (the default vercel image), and add your file.<br><br>
<i>Optional</i>: Modify the background.<br><br>
Uncomment this line in `index.tsx`<br><br>
![bg-edit](https://media.discordapp.net/attachments/1051281685234327613/1122182177090707456/bgedit.png?width=1864&height=450)<br><br>
Add an image url<br><br>
![bg-edit2](https://media.discordapp.net/attachments/1051281685234327613/1122182176000188507/bg-edit2.png?width=1864&height=432)<br><br>
Uncomment this line:<br><br>
![bg-edit3](https://media.discordapp.net/attachments/1051281685234327613/1122182176461574225/bg-edit3.png?width=1864&height=366)<br><br>
![bg-edit4](https://media.discordapp.net/attachments/1051281685234327613/1122182176818069606/bg-edit4.png?width=1864&height=364)<br><br>

# Ship it on Vercel

Head over to [Vercel.com](https://vercel.com) and link your Github.<br><br>
Add New Project<br><br>
![add new project](https://media.discordapp.net/attachments/1051281685234327613/1121085093641998336/image.png)<br><br>
Select this repo
