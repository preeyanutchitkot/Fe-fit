const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function loginWithGoogle(token: string) {
	const response = await fetch(`${BACKEND_URL}/auth/google`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token }),
	});
	const data = await response.json();
	return { response, data };
}
