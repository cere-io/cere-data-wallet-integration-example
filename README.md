![Favicon](public/favicon.png)
# Cere Data Wallet integration example

## Why

The Cere Wallet brings intelligence TO your data, rather then the other way around.

The wallet serves as a gateway to true data ownership by providing users with cryptographic control over their data.

Through their wallet, integrated (via SDK) into applications, users can securely sign and encrypt their activity data using their private keys. Rather than having user data scattered across various applications and services, the Cere Wallet creates a unified, user-controlled data layer where activities are stored in an encrypted format and can only be accessed with explicit user permission.

This ensures that even while applications can request to store and process user data, the ultimate control remains with the user who can grant or revoke access through their wallet - transforming the traditional model where applications own user data into one where users truly own their digital identity and activities, while applications being able to leverage user data to reward them.

## How

In order to store activity in user’s data wallet, you need to authenticate user using Cere Wallet first and then use this wallet to produce signed and encrypted events that will be later dynamically indexed for intelligent analytic purpose.

### [Cere Wallet](https://www.npmjs.com/package/@cere/embed-wallet)

In general, follow above [Readme](https://www.npmjs.com/package/@cere/embed-wallet?activeTab=readme)

In short, you should be able to connect Cere Wallet, initializing it using these simply steps:

```tsx
await wallet.init({
  appId: 'cere-data-wallet-integration-example',
  connectOptions: {
    permissions: {
      ed25519_signRaw: {
        title: 'Signing activity',
        description: 'Allow the application to sign your activity before storing it into your data wallet.',
      },
    },
  },
});
await wallet.isReady
await wallet.connect()
```

handling above state initialization properly, according to your codebase of course (the app you’re integrating it with).

### Activity SDK

[https://www.npmjs.com/package/@cere-activity-sdk/events](https://www.npmjs.com/package/@cere-activity-sdk/events)

[https://www.npmjs.com/package/@cere-activity-sdk/signers](https://www.npmjs.com/package/@cere-activity-sdk/signers)

[https://www.npmjs.com/package/@cere-activity-sdk/ciphers](https://www.npmjs.com/package/@cere-activity-sdk/ciphers)

The next step is to integrate our activity SDK. It’s pretty simple to do once you have Cere Wallet integrated. First of all, you need to install required Activity SDK packages:

```bash
npm i @cere-activity-sdk/events @cere-activity-sdk/signers @cere-activity-sdk/ciphers
```

Then, you need to create signers and ciphers that are used to (1) sign the activity and (2) encrypt user’s data using connected cere wallet (private key):

```tsx
import { CereWalletSigner } from '@cere-activity-sdk/signers';
import { CereWalletCipher } from '@cere-activity-sdk/ciphers';

const cereWalletSigner = new CereWalletSigner(wallet);
const cereWalletCipher = new CereWalletCipher(wallet);

await cereWalletSigner.isReady();
await cereWalletCipher.isReady();
```

OR use `NoOpCipher` if you don't need your data to be encrypted. 
```tsx
import { NoOpCipher } from '@cere-activity-sdk/ciphers';

const cereWalletCipher = new NoOpCipher() 
await cereWalletCipher.isReady();
```

The last initialization step is to connect Event Client:

```tsx
import { EventSource } from '@cere-activity-sdk/events';

const eventSource = new EventSource(cereWalletSigner, cereWalletCipher, {
  appId: import.meta.env.VITE_APP_ID!,
  dispatchUrl: import.meta.env.VITE_DISPATCH_URL!,
  listenUrl: import.meta.env.VITE_LISTEN_URL!,
  dataServicePubKey: import.meta.env.VITE_DATA_SERVICE_PUB_KEY!,
  appPubKey: import.meta.env.VITE_APP_PUB_KEY!,
})

await eventSource.connect();
```

The `APP_PUBLIC_KEY` parameter is a public key of ed25519 key-pair that belongs to your application. This key-pair is used to identify your app. Please, make sure that you’ve stored private key in secure place. After EventSource is initialized, you can use it to send events like this:

```tsx
const payload = { // Payload is a json object that can include any fields and can be empty.
   anyParam: 'any value',
};

const activityEvent = new ActivityEvent('EVENT_NAME_OF_YOUR_CHOICE', payload);

await eventSource.dispatchEvent(activityEvent);
```

## Testing

Ask Cere Team to provide you all the values.
```bash
npm i
npm run dev
```
```
Click "Connect Cere Wallet" button and follow the instructions.
```
```
Click "Send test event" button, once connected.
```

In order to test your integration, you can use our [Decentralized Data Viewer](https://ddc.cere.network)

Sign In using the same Cere Wallet and provide `appId` that you’ve used in your integration. You should be able to see your events in the viewer.

---
```
Thank you for using Cere Data Wallet 🤝 🫡
```
