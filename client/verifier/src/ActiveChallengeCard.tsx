import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { VerificationRequest, MetaMaskConnection } from './DappApi';
import { createSignedChallengeMessage } from './ChallengeUtils';

interface ActiveChallenge {
    request: VerificationRequest;
    secretCode: number;
}

interface ActiveChallengeCardProps {
    challenge: ActiveChallenge;
    connection: MetaMaskConnection;
    onChallengeSent: (challenge: ActiveChallenge) => void;
}

interface State {
    challengeMessage: string | null;
}

class ActiveChallengeCard extends React.Component<ActiveChallengeCardProps, State> {
    state = { challengeMessage: null };

    componentDidMount() {
        createSignedChallengeMessage(this.props.challenge.secretCode, this.props.connection)
            .then(message => this.setState({ challengeMessage: message }));
    }

    render() {
        const request = this.props.challenge.request;
        const { challengeMessage } = this.state;
        return (
            <Box sx={{ my: '2px' }}>
                <Card sx={{ width: 450 }}>
                    <CardContent>
                        <Typography sx={{ fontSize: 14 }} color="text.primary" gutterBottom>
                            Issuing challenge...
                        </Typography>
                        <Typography sx={{ fontSize: 12 }} color="text.primary" gutterBottom>
                            Send the following text to +{request.phoneNumber.countryCode} {request.phoneNumber.number}
                        </Typography>
                        <Divider variant="middle" />
                        <div>
                            <Typography sx={{ fontSize: 12, my: '2px' }} color="text.secondary" gutterBottom align={'left'} noWrap={false}>
                                {challengeMessage || 'Loading...'}
                            </Typography>
                        </div>
                    </CardContent>
                    {challengeMessage !== null && (
                        <CardActions>
                            <Button
                                size="small"
                                onClick={() => this.props.onChallengeSent(this.props.challenge)}
                            >
                                Sent!
                            </Button>
                        </CardActions>
                    )}
                </Card>
            </Box>
        )
    }
}

export { ActiveChallengeCard };
export type { ActiveChallenge };