import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface AccountCardProps {
    account: string;
}

class AccountCard extends React.Component<AccountCardProps, {}> {
    render() {
        return (
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
        )
    }
}

export { AccountCard };
