import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <h1 className="text-3xl font-bold underline text-blue-600">
                Hello World!
            </h1>
            <nav style={{ display: 'flex', gap: 8 }}>
                <Link to="/pets">Ver Pets</Link>
            </nav>
        </div>
    );
}
