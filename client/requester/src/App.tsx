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

  handleVerificationSuccess = (request: VerificationRequest) => {
    this.setState({ pendingVerificationRequest: null });
    alert(`Sucess! Your phone number (+${request.phoneNumber.countryCode} ${request.phoneNumber.number}) has been verified`);
  }

  handleVerificationFailure = (request: VerificationRequest) => {
    this.setState({ pendingVerificationRequest: null });
    alert(`Failed to verify ownership of +${request.phoneNumber.countryCode} ${request.phoneNumber.number}`);
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
              {pendingVerificationRequest !== null && (
                <PendingVerificationCard
                  pendingVerificationRequest={pendingVerificationRequest}
                  connection={connection}
                  onVerificationSuccess={this.handleVerificationSuccess}
                  onVerificationFailure={this.handleVerificationFailure}
                />
              )}
            </div>
          )}
        </header>
      </div>
    );
  }
}

export default App;
