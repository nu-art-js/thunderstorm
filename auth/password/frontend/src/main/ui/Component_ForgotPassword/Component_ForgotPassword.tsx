import {useState} from 'react';
import {ModuleFE_PasswordAuth} from '../../ModuleFE_PasswordAuth.js';

export const Component_ForgotPassword = () => {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		setError(undefined);
		setLoading(true);
		try {
			await ModuleFE_PasswordAuth.requestReset({email});
			setSubmitted(true);
		} catch (e: any) {
			setError(e.message ?? 'Failed to send reset email');
		} finally {
			setLoading(false);
		}
	};

	if (submitted)
		return (
			<div className="forgot-password">
				<h2>Check your email</h2>
				<p>If an account exists for {email}, we sent a password reset link.</p>
			</div>
		);

	return (
		<div className="forgot-password">
			<h2>Forgot Password</h2>
			<input
				type="email"
				placeholder="Enter your email"
				value={email}
				onChange={e => setEmail(e.target.value)}
			/>
			{error && <p className="error">{error}</p>}
			<button onClick={handleSubmit} disabled={loading || !email}>
				{loading ? 'Sending...' : 'Send Reset Link'}
			</button>
		</div>
	);
};
