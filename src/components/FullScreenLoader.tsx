import type React from 'react';
import { ImSpinner2 as SpinnerIcon } from 'react-icons/im';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center relative">
      <span className="sr-only">Loading...</span>
      <div aria-hidden="true">
        <SpinnerIcon className="text-3xl animate-spin text-gray-700" />
      </div>
    </div>
  );
};

export default FullScreenLoader;
