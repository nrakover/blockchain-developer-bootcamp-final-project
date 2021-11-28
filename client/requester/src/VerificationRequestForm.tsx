import React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';

interface RequestFormProps {
    onSubmit: (countryCode: number, phoneNumber: number) => void;
}

interface State {
    countryCode: string;
    phoneNumber: string;
}

class VerificationRequestForm extends React.Component<RequestFormProps, State> {
    constructor(props: RequestFormProps) {
        super(props);
        this.state = { countryCode: '', phoneNumber: '' };
    }

    handleCountryCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ countryCode: event.target.value });
    };

    handlePhoneNumberhange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ phoneNumber: event.target.value });
    };

    handleSubmit = () => {
        const { countryCode, phoneNumber } = this.state;
        if (countryCode == null || phoneNumber == null) {
            alert("Please enter a valid country code and phone numbers");
            return;
        }

        this.props.onSubmit(parseInt(countryCode), parseInt(phoneNumber));
    }

    render() {
        const { countryCode, phoneNumber } = this.state;
        return (
            <Card
                component="form"
                sx={{ width: 450 }}
                noValidate
                autoComplete="off"
            >
                <CardContent>
                    <div>
                        <TextField
                            id="country-code"
                            label="Country code"
                            variant="outlined"
                            margin="normal"
                            value={countryCode}
                            onChange={this.handleCountryCodeChange}
                        />
                        <TextField
                            id="phone-to-verify"
                            label="Phone number"
                            variant="outlined"
                            margin="normal"
                            placeholder="##########"
                            value={phoneNumber}
                            onChange={this.handlePhoneNumberhange}
                        />
                    </div>
                    <div>
                        <Button
                            id="submit-verification-request-button"
                            variant="contained"
                            color="secondary"
                            onClick={this.handleSubmit}
                        >Request verification</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
}

export { VerificationRequestForm };
