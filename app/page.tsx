export default function Home() {
    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4', padding: '2rem' }}>
            <h1>OpenDuty API Service</h1>
            <p>The backend is running successfully.</p>
            <p>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span></p>
            <hr />
            <p>Available Endpoints:</p>
            <ul>
                <li>/api/health (Try this)</li>
                <li>/api/auth/login</li>
            </ul>
        </div>
    );
}
