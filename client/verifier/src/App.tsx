import React from 'react';
import './App.css';
import { Dapp, MetaMaskConnection, VerificationRequest } from './DappApi';
import { AccountCard } from './AccountCard';
import { VerificationsQueue } from './VerificationsQueue';
import { ActiveChallenge, ActiveChallengeCard } from './ActiveChallengeCard';

interface AppProps { }

interface State {
  connection: MetaMaskConnection | null;
  verificationRequests: { [key: number]: VerificationRequest };
  activeChallenge: ActiveChallenge | null;
}

class App extends React.Component<AppProps, State> {
  constructor(props: AppProps) {
    super(props);
    this.state = { connection: null, verificationRequests: {}, activeChallenge: null };
  }

  componentDidMount() {
    Dapp.connectToMetaMask((connection) => {
      this.setState({ connection: connection });
      alert(`MetaMask detected! Account: ${connection.account}`);
      Dapp.registerVerifierSelectionListener(connection, (request: VerificationRequest) => {
        this.setState(prevState => ({ verificationRequests: { ...prevState.verificationRequests, [request.verificationRequestId]: request } }));
      });
    });
  }

  handleChallengeGenerated = (request: VerificationRequest, secretCode: number) => {
    this.setState(prevState => {
      const newVerificationRequests = { ...prevState.verificationRequests };
      delete newVerificationRequests[request.verificationRequestId];
      return { activeChallenge: { request: request, secretCode: secretCode }, verificationRequests: newVerificationRequests };
    });
  }

  handleChallengeSent = () => {
    this.setState({ activeChallenge: null });
  }

  render() {
    const { connection, verificationRequests, activeChallenge } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {connection && (
            <div>
              <AccountCard account={connection.account} />
              {activeChallenge !== null && (
                <ActiveChallengeCard
                  challenge={activeChallenge}
                  connection={connection}
                  onChallengeSent={this.handleChallengeSent}
                />
              )}
              <VerificationsQueue
                requests={Object.values(verificationRequests)}
                connection={connection}
                onChallengeGenerated={this.handleChallengeGenerated}
                allowIssuingNewChallenge={activeChallenge === null}
              />
            </div>
          )}
        </header>
      </div>
    );
  }
}

export default App;
