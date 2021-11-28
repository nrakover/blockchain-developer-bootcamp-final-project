import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { VerificationRequest, MetaMaskConnection } from './DappApi';
import { generateAndRecordChallenge } from './ChallengeUtils';

interface QueuedVerificationCardProps {
    request: VerificationRequest;
    onChallengeGenerated: (request: VerificationRequest, secretCode: number) => void;
    connection: MetaMaskConnection;
    allowIssuingNewChallenge: boolean;
}

class QueuedVerificationCard extends React.Component<QueuedVerificationCardProps> {
    render() {
        return (
            <Box sx={{ my: '2px' }}>
                <Card sx={{ width: 450 }}>
                    <CardContent>
                        <Typography sx={{ fontSize: 14 }} color="text.primary" gutterBottom>
                            +{this.props.request.phoneNumber.countryCode} {this.props.request.phoneNumber.number}
                        </Typography>
                        <Typography sx={{ fontSize: 11, mb: 1.5 }} color="text.secondary">
                            Request ID: {this.props.request.verificationRequestId}
                        </Typography>
                    </CardContent>
                    {this.props.allowIssuingNewChallenge && (
                        <CardActions>
                            <Button
                                size="small"
                                onClick={() => {
                                    generateAndRecordChallenge(this.props.request, this.props.connection)
                                        .then(secretCode => this.props.onChallengeGenerated(this.props.request, secretCode))
                                }}>
                                Generate challenge
                            </Button>
                        </CardActions>
                    )}

                </Card>
            </Box>
        )
    }
}

interface VerificationsQueueProps {
    requests: Array<VerificationRequest>;
    onChallengeGenerated: (request: VerificationRequest, secretCode: number) => void;
    connection: MetaMaskConnection;
    allowIssuingNewChallenge: boolean;
}

class VerificationsQueue extends React.Component<VerificationsQueueProps> {
    render() {
        return (
            <Box sx={{ my: '7px' }}>
                {this.props.requests.map(request =>
                    <QueuedVerificationCard
                        request={request}
                        onChallengeGenerated={this.props.onChallengeGenerated}
                        connection={this.props.connection}
                        allowIssuingNewChallenge={this.props.allowIssuingNewChallenge}
                    />)}
            </Box>
        )
    }
}

export { VerificationsQueue };
