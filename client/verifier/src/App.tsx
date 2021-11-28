import React from 'react';
import './App.css';
import { Dapp, MetaMaskConnection, VerificationRequest } from './DappApi';
import { AccountCard } from './AccountCard';
import { VerificationsQueue } from './VerificationsQueue';

interface AppProps {

}

interface State {
  connection: MetaMaskConnection | null;
  verificationRequests: { [key: number]: VerificationRequest };
}

class App extends React.Component<AppProps, State> {
  constructor(props: AppProps) {
    super(props);
    this.state = { connection: null, verificationRequests: {} };
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

  render() {
    const { connection, verificationRequests } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {connection && (
            <div>
              <AccountCard account={connection.account} />
            </div>
          )}
          <VerificationsQueue requests={Object.values(verificationRequests)} />
        </header>
      </div>
    );
  }
}

export default App;
