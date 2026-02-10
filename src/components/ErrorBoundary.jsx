import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-2xl w-full">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl">
                            ⚠️
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 mb-4">Something went wrong</h2>
                        <p className="text-gray-500 mb-8">
                            The application crashed. Please try refreshing the page.
                        </p>
                        <div className="bg-gray-100 p-4 rounded-xl mb-8 text-left overflow-x-auto">
                            <code className="text-xs text-red-500">{this.state.error?.toString()}</code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg"
                        >
                            Refresh Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
