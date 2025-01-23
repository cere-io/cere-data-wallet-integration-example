import './App.css'
import { useMemo, useState } from 'react'
import { EmbedWallet } from '@cere/embed-wallet'
import { CereWalletSigner } from '@cere-activity-sdk/signers'
import { ActivityEvent, EventSource } from '@cere-activity-sdk/events'
import { CereWalletCipher } from '@cere-activity-sdk/ciphers'

function App () {
  const [isConnected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const wallet = useMemo(() => new EmbedWallet(), [])

  const connect = async () => {
    try {
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
      })
      await wallet.isReady
      await wallet.connect()

      setConnected(true)
      setSuccessMsg('Cere Wallet connected')
    } catch (error) {
      console.log(error)
      setError(`Something went wrong: ${error}`)
    }
  }

  const send = async () => {
    try {
      const cereWalletSigner = new CereWalletSigner(wallet)
      const cereWalletCipher = new CereWalletCipher(wallet)

      await cereWalletSigner.isReady()
      await cereWalletCipher.isReady()

      const eventSource = new EventSource(cereWalletSigner, cereWalletCipher, {
        appId: import.meta.env.VITE_APP_ID!,
        dispatchUrl: import.meta.env.VITE_DISPATCH_URL!,
        listenUrl: import.meta.env.VITE_LISTEN_URL!,
        dataServicePubKey: import.meta.env.VITE_DATA_SERVICE_PUB_KEY!,
        appPubKey: import.meta.env.VITE_APP_PUB_KEY!,
      })

      await eventSource.connect()

      const payload = { // Payload is a json object that can include any fields. can be empty.
        anyParam: 'any value',
      }
      const activityEvent = new ActivityEvent('WALLET_CONNECT_TEST', payload)

      await eventSource.dispatchEvent(activityEvent)
      setSuccessMsg('Event dispatched successfully')
    } catch (error) {
      console.log(error)
      setError(`Something went wrong: ${error}`)
    }
  }

  return (
    <>
      <h1>Cere Data Wallet</h1>
      <h2>integration example</h2>
      {
        isConnected ? (
          <div className="card">
            <button onClick={send}>
              Send test event
            </button>
          </div>
        ) : (
          <div className="card">
            <button onClick={connect}>
              Connect Cere Wallet
            </button>
          </div>
        )
      }
      {successMsg && <div style={{color: 'green'}}>{successMsg}</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
    </>
  )
}

export default App
