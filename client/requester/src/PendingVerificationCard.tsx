import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Typography from '@mui/material/Typography';
import { VerificationRequest, MetaMaskConnection } from './DappApi';
import { validateAndSubmitChallengeResponse } from './ChallengeUtils';

interface PendingVerificationCardProps {
    pendingVerificationRequest: VerificationRequest;
    connection: MetaMaskConnection;
    onVerificationSuccess: (request: VerificationRequest) => void;
    onVerificationFailure: (request: VerificationRequest) => void;
}

interface State {
    challengeMessage: string;
}

class PendingVerificationCard extends React.Component<PendingVerificationCardProps, State> {
    state = { challengeMessage: '' };

    handleChallengeMessageChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ challengeMessage: event.target.value });
    };

    handleResponseSubmission = () => {
        const { challengeMessage } = this.state;
        validateAndSubmitChallengeResponse(
            challengeMessage,
            this.props.pendingVerificationRequest.verificationRequestId,
            this.props.connection,
            () => this.props.onVerificationSuccess(this.props.pendingVerificationRequest),
            () => this.props.onVerificationFailure(this.props.pendingVerificationRequest)
        );
    }

    render() {
        const { challengeMessage } = this.state;
        return (
            <Box sx={{ my: '7px' }}>
                <Card sx={{ width: 450 }}>
                    <CardContent>
                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                            Pending verification
                        </Typography>
                        <Typography sx={{ fontSize: 11 }} color="text.secondary" gutterBottom>
                            ID: {this.props.pendingVerificationRequest.verificationRequestId}
                        </Typography>
                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                            +{this.props.pendingVerificationRequest.phoneNumber.countryCode} {this.props.pendingVerificationRequest.phoneNumber.number}
                        </Typography>
                        <Divider variant="middle" />
                        <Box sx={{ my: '2px' }}>
                            <TextareaAutosize value={challengeMessage || ''} onChange={this.handleChallengeMessageChanged} />
                        </Box>
                    </CardContent>
                    <CardActions>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={this.handleResponseSubmission}
                        >Validate and submit response</Button>
                    </CardActions>
                </Card>
            </Box>
        )
    }
}

export { PendingVerificationCard };
