import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface AccountCardProps {
    account: string;
}

class AccountCard extends React.Component<AccountCardProps, {}> {
    render() {
        return (
            <Box sx={{ my: '7px' }}>
                <Card sx={{ width: 450 }}>
                    <CardContent>
                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                            Connected Account
                        </Typography>
                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                            {this.props.account}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        )
    }
}

export { AccountCard };
