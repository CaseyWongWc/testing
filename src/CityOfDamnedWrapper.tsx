import React from 'react';

// This wrapper component ensures the CityOfTheDamned component is loaded
// only in the correct route
const CityOfDamnedWrapper: React.FC = () => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        // Dynamically import the CityOfTheDamned component
        const module = await import('./secret/CityOfTheDamned');
        setComponent(() => module.default);
      } catch (err) {
        console.error('Error loading CityOfTheDamned component:', err);
        setError('Failed to load City of the Damned component. Please check the console for details.');
      }
    };

    loadComponent();
  }, []);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded">
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading City of the Damned...</p>
        </div>
      </div>
    );
  }

  return <Component />;
};

export default CityOfDamnedWrapper;