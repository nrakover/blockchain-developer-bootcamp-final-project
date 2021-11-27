import React from 'react';
import './App.css';
import { Dapp, MetaMaskConnection } from './DappApi';
import { AccountCard } from './AccountCard';
import { VerificationRequestForm } from './VerificationRequestForm';

interface State {
  connection: MetaMaskConnection | null;
}

class App extends React.Component<{}, State> {
  constructor() {
    super({});
    this.state = { connection: null };
  }

  async componentDidMount() {
    await Dapp.connectToMetaMask((connection) => {
      this.setState({ connection: connection });
      alert(`MetaMask detected! Account: ${connection.account}`);
    });
  }

  render() {
    const { connection } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {connection && (
            <div>
              <AccountCard account={connection.account} />
              <VerificationRequestForm
                onSubmit={
                  (countryCode: number, phoneNumber: number) => Dapp.submitVerificationRequest(connection, { countryCode: countryCode, number: phoneNumber })
                }
              />
            </div>
          )}
        </header>
      </div>
    );
  }
}

export default App;
