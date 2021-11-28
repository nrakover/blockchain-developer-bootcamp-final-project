import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { VerificationRequest } from './DappApi';

interface QueuedVerificationCardProps {
    request: VerificationRequest;
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
                </Card>
            </Box>
        )
    }
}

interface VerificationsQueueProps {
    requests: Array<VerificationRequest>;
}

class VerificationsQueue extends React.Component<VerificationsQueueProps> {
    render() {
        return (
            <Box sx={{ my: '7px' }}>
                {this.props.requests.map(request => <QueuedVerificationCard request={request} />)}
            </Box>
        )
    }
}

export { VerificationsQueue };
