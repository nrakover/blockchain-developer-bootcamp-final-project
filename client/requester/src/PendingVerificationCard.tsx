import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { VerificationRequest } from './DappApi';

interface PendingVerificationCardProps {
    pendingVerificationRequest: VerificationRequest;
}

class PendingVerificationCard extends React.Component<PendingVerificationCardProps> {
    render() {
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
                    </CardContent>
                </Card>
            </Box>
        )
    }
}

export { PendingVerificationCard };
