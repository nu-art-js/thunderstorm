import {useState} from 'react';
import {ModuleFE_PasswordAuth} from '../../ModuleFE_PasswordAuth.js';

type Props = {
	token: string;
	onSuccess?: () => void;
};

export const Component_ResetPassword = ({token, onSuccess}: Props) => {
	const [password, setPassword] = useState('');
	const [passwordCheck, setPasswordCheck] = useState('');
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async () => {
		setError(undefined);
		if (password !== passwordCheck) {
			setError('Passwords do not match');
			return;
		}

		setLoading(true);
		try {
			await ModuleFE_PasswordAuth.executeReset({token, password, passwordCheck});
			setSuccess(true);
			onSuccess?.();
		} catch (e: any) {
			setError(e.message ?? 'Failed to reset password');
		} finally {
			setLoading(false);
		}
	};

	if (success)
		return (
			<div className="reset-password">
				<h2>Password Reset</h2>
				<p>Your password has been reset successfully. You can now log in.</p>
			</div>
		);

	return (
		<div className="reset-password">
			<h2>Reset Password</h2>
			<input
				type="password"
				placeholder="New password"
				value={password}
				onChange={e => setPassword(e.target.value)}
			/>
			<input
				type="password"
				placeholder="Confirm password"
				value={passwordCheck}
				onChange={e => setPasswordCheck(e.target.value)}
			/>
			{error && <p className="error">{error}</p>}
			<button onClick={handleSubmit} disabled={loading || !password || !passwordCheck}>
				{loading ? 'Resetting...' : 'Reset Password'}
			</button>
		</div>
	);
};
