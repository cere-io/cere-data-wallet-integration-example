import './App.css'
import {EmbedWallet} from '@cere/embed-wallet'
import {CereWalletSigner} from '@cere-activity-sdk/signers'
import {ActivityEvent, EventSource} from '@cere-activity-sdk/events'
import {CereWalletCipher} from '@cere-activity-sdk/ciphers'
import {useRef, useState} from "react";
import {CSVLink} from "react-csv";
import {DNA, MagnifyingGlass} from 'react-loader-spinner'

function App() {
    const wallet = new EmbedWallet()

    const [leaderboard, setLeaderboard] = useState<string[][]>(null);
    const [eventSource, setEventSource] = useState<EventSource>(null);
    const [isDataWalletConnected, setIsDataWalletConnected] = useState<boolean>(false);
    const [isWalletLoading, setIsWalletLoading] = useState<boolean>(false);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState<boolean>(false);
    const [campaignId, setCampaignId] = useState<string>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const csvLinkRef = useRef(null);

    const connect = async () => {
        setIsWalletLoading(true);
        console.log(import.meta.env.VITE_ENV)
        await wallet.init({
            appId: 'cere-data-wallet-integration-example',
            env: import.meta.env.VITE_ENV,
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
        await wallet.connect();

        const cereWalletSigner = new CereWalletSigner(wallet);
        const cereWalletCipher = new CereWalletCipher(wallet);
        const eventSource = new EventSource(cereWalletSigner, cereWalletCipher, {
            appId: import.meta.env.VITE_APP_ID!,
            dispatchUrl: import.meta.env.VITE_DISPATCH_URL!,
            listenUrl: import.meta.env.VITE_LISTEN_URL!,
            dataServicePubKey: import.meta.env.VITE_DATA_SERVICE_PUB_KEY!,
            appPubKey: import.meta.env.VITE_APP_PUB_KEY!,
        });

        await eventSource.connect()
        setEventSource(eventSource)
        setIsDataWalletConnected(true);
        setIsWalletLoading(false);
    }

    const send = async () => {
        setIsLeaderboardLoading(true);
        eventSource.addEventListener('engagement', function (engagement: any) {
            setIsLeaderboardLoading(false);
            console.log('got engagement', engagement);
            const result = engagement.payload.integrationScriptResults[0];
            if (!result) {
                setErrorMessage("No data found (might be wrong campaign)");
            }
            const users = result.users;
            const usersCsvData: string[][] = [
                ["Address", "Score"],
                ...users.map((user) => [user.user, user.points]),
            ];
            setLeaderboard(usersCsvData);
            csvLinkRef.current.link.click();
        });

        await eventSource.connect();

        const {event_type, timestamp, data} = {
            event_type: 'GET_LEADERBOARD',
            timestamp: new Date().toISOString(),
            data: JSON.stringify({
                campaignId: campaignId,
                campaign_id: campaignId,
            }),
        };
        const parsedData = JSON.parse(data);
        const event = new ActivityEvent(event_type, {
            ...parsedData,
            timestamp,
        });

        await eventSource.dispatchEvent(event);
    }

    const handleCloseAlert = () => {
        setErrorMessage(""); // Clear the error message when the user closes the alert
    };

    return (
        <>
            <h1>Leaderboard Downloader</h1>
            {isWalletLoading ? <DNA
                    height="80"
                    width="80"
                    ariaLabel="dna-loading"
                    wrapperStyle={{}}
                    wrapperClass="dna-wrapper"
                /> :
                isDataWalletConnected ? isLeaderboardLoading ?
                    <MagnifyingGlass
                        visible={true}
                        height="80"
                        width="80"
                        ariaLabel="magnifying-glass-loading"
                        wrapperStyle={{}}
                        wrapperClass="magnifying-glass-wrapper"
                        glassColor="#c0efff"
                        color="#e15b64"
                    /> : (
                        <div className="card">
                            <h4>Please, enter campaign id</h4>
                            <input style={{width: '60%'}} type="number" value={campaignId}
                                   onChange={(event) => setCampaignId(event.target.value)}/>
                            <button style={{width: '60%'}} onClick={send} disabled={!campaignId}>
                                Download leaderboard
                            </button>
                        </div>
                    ) : (
                    <div className="card">
                        <button onClick={connect}>
                            Connect Cere Data Wallet
                        </button>
                    </div>
                )
            }

            {
                leaderboard ? (
                    <div className="card" style={{display: "none"}}>
                        <CSVLink filename={`leaderboard_${campaignId}.csv`} data={leaderboard}
                                 ref={csvLinkRef}>abc</CSVLink>
                    </div>
                ) : (<></>)
            }

            {errorMessage && (
                <div style={{
                    marginTop: "20px",
                    padding: "10px",
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "5px"
                }}>
                    <span>{errorMessage}</span>
                    <button
                        onClick={handleCloseAlert}
                        style={{
                            marginLeft: "10px",
                            backgroundColor: "white",
                            color: "red",
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>
            )}
        </>
    )
}

export default App
