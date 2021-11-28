import React from 'react';
import './App.css';
import { Dapp, MetaMaskConnection, VerificationRequest } from './DappApi';
import { AccountCard } from './AccountCard';
import { VerificationRequestForm } from './VerificationRequestForm';
import { PendingVerificationCard } from './PendingVerificationCard';

interface AppProps {

}

interface State {
  connection: MetaMaskConnection | null;
  pendingVerificationRequest: VerificationRequest | null;
}

class App extends React.Component<AppProps, State> {
  constructor(props: AppProps) {
    super(props);
    this.state = { connection: null, pendingVerificationRequest: null };
  }

  async componentDidMount() {
    await Dapp.connectToMetaMask((connection) => {
      this.setState({ connection: connection });
      alert(`MetaMask detected! Account: ${connection.account}`);
    });
  }

  render() {
    const { connection, pendingVerificationRequest } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {connection && (
            <div>
              <AccountCard account={connection.account} />
              {pendingVerificationRequest == null && (
                <VerificationRequestForm
                  onSubmit={
                    (countryCode: number, phoneNumber: number) => Dapp.submitVerificationRequest(connection, { countryCode: countryCode, number: phoneNumber })
                      .then((request) => this.setState({ pendingVerificationRequest: request }))
                  }
                />
              )}
              {pendingVerificationRequest !== null && (<PendingVerificationCard pendingVerificationRequest={pendingVerificationRequest} />)}
            </div>
          )}
        </header>
      </div>
    );
  }
}

export default App;
