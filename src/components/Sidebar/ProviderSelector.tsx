import { useProjectStore } from '../../stores/projectStore';
import type { CloudProvider } from '../../types';

const providers: { id: CloudProvider; name: string; icon: string; color: string }[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    icon: '☁️',
    color: '#FF9900',
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    icon: '⬡',
    color: '#0078D4',
  },
];

export function ProviderSelector() {
  const { project, setProvider } = useProjectStore();
  const currentProvider = project.provider || 'aws';

  const handleProviderChange = (provider: CloudProvider) => {
    if (provider !== currentProvider) {
      // Confirm if services are selected
      const hasServices = Object.values(project.services).some((s) => s !== null);
      if (hasServices) {
        const confirmed = window.confirm(
          `Switching to ${provider === 'aws' ? 'AWS' : 'Azure'} will reset all selected services. Continue?`
        );
        if (!confirmed) return;
      }
      setProvider(provider);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
        Cloud Provider
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderChange(provider.id)}
            className={`
              btn-soft relative flex flex-col items-center justify-center p-4 rounded-xl
              transition-all duration-200 ease-out
              ${
                currentProvider === provider.id
                  ? 'ring-2 ring-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : 'bg-gray-800/60 shadow-md shadow-black/10 hover:bg-gray-700/60 hover:shadow-lg hover:scale-[1.02]'
              }
            `}
          >
            <span className="text-2xl mb-1.5">{provider.icon}</span>
            <span
              className={`text-xs font-medium ${
                currentProvider === provider.id ? 'text-blue-400' : 'text-gray-300'
              }`}
            >
              {provider.id === 'aws' ? 'AWS' : 'Azure'}
            </span>
            {currentProvider === provider.id && (
              <div
                className="absolute top-2 right-2 w-2 h-2 rounded-full shadow-sm"
                style={{ backgroundColor: provider.color }}
              />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2 px-1">
        {currentProvider === 'aws'
          ? 'Generate Terraform for Amazon Web Services'
          : 'Generate Terraform for Microsoft Azure'}
      </p>
    </div>
  );
}
