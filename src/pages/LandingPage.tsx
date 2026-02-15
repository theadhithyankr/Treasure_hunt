import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-treasure-100 to-treasure-200">
            {/* Logo/Title at top */}
            <header className="p-6 text-center safe-area-top">
                <div className="text-6xl mb-2">🗺️</div>
                <h1 className="text-4xl font-adventure text-treasure-700 mb-2">
                    Treasure Hunt
                </h1>
                <p className="text-treasure-600 text-lg">
                    Adventure Awaits!
                </p>
            </header>

            {/* Buttons stack vertically */}
            <div className="flex-1 flex flex-col justify-center gap-6 p-6 max-w-md mx-auto w-full">
                <Link to="/player/login">
                    <button className="btn-primary">
                        <span className="text-3xl mr-3">🎒</span>
                        Join as Player
                    </button>
                </Link>

                <Link to="/coordinator/login">
                    <button className="btn-secondary">
                        <span className="text-3xl mr-3">🧭</span>
                        Coordinator Access
                    </button>
                </Link>
            </div>

            {/* Footer */}
            <footer className="p-6 text-center text-treasure-600 text-sm safe-area-bottom">
                <p>Mobile-First Treasure Hunt Adventure</p>
            </footer>
        </div>
    );
}
