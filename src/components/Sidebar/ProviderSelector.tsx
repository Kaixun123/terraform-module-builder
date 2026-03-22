import { useProjectStore } from '../../stores/projectStore';
import type { CloudProvider } from '../../types';

const providers: { id: CloudProvider; name: string; description: string; color: string }[] = [
  { id: 'aws',   name: 'AWS',   description: 'Amazon Web Services', color: '#FF9900' },
  { id: 'azure', name: 'Azure', description: 'Microsoft Azure',     color: '#0078D4' },
];

export function ProviderSelector() {
  const { project, setProvider } = useProjectStore();
  const currentProvider = project.provider || 'aws';

  const handleProviderChange = (provider: CloudProvider) => {
    if (provider === currentProvider) return;
    const hasServices = Object.values(project.services).some((s) => s !== null);
    if (hasServices) {
      const confirmed = window.confirm(
        `Switching to ${provider === 'aws' ? 'AWS' : 'Azure'} will reset all selected services. Continue?`
      );
      if (!confirmed) return;
    }
    setProvider(provider);
  };

  return (
    <div>
      <h3 className="section-label mb-3">Cloud Provider</h3>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const active = currentProvider === provider.id;
          return (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all duration-150 ${
                active
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: provider.color }}
              >
                {provider.id === 'aws' ? 'AWS' : 'Az'}
              </div>
              <span className={`text-xs font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                {provider.name}
              </span>
              {active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {currentProvider === 'aws'
          ? 'Generating Terraform for Amazon Web Services'
          : 'Generating Terraform for Microsoft Azure'}
      </p>
    </div>
  );
}
