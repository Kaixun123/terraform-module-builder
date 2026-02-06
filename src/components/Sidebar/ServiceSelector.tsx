import { useProjectStore } from '../../stores/projectStore';
import { SERVICE_METADATA, SERVICE_CATEGORIES, DEPENDENCY_GRAPH } from '../../constants';
import { AZURE_SERVICE_METADATA, AZURE_SERVICE_CATEGORIES, AZURE_DEPENDENCY_GRAPH } from '../../constants/azure/dependencies';
import type { ServiceType } from '../../types';

export default function ServiceSelector() {
  const { project, toggleService, isServiceEnabled, getServiceDependents } =
    useProjectStore();

  const isAzure = project.provider === 'azure';
  const serviceMetadata = isAzure ? AZURE_SERVICE_METADATA : SERVICE_METADATA;
  const serviceCategories = isAzure ? AZURE_SERVICE_CATEGORIES : SERVICE_CATEGORIES;
  const dependencyGraph = isAzure ? AZURE_DEPENDENCY_GRAPH : DEPENDENCY_GRAPH;

  const handleToggle = (service: ServiceType, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      // Check if any dependents would be affected
      const dependents = getServiceDependents(service);
      if (dependents.length > 0) {
        const dependentNames = dependents
          .map((d) => serviceMetadata[d].name)
          .join(', ');
        const confirmed = window.confirm(
          `Disabling ${serviceMetadata[service].name} will also disable: ${dependentNames}. Continue?`
        );
        if (!confirmed) return;
      }
    }
    toggleService(service, !currentlyEnabled);
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        {isAzure ? 'Azure Services' : 'AWS Services'}
      </h2>
      <div className="space-y-4">
        {serviceCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              {category.name}
            </h3>
            <div className="space-y-1.5">
              {category.services.map((serviceId) => {
                const service = serviceMetadata[serviceId];
                const enabled = isServiceEnabled(serviceId);
                const dependencies = dependencyGraph[serviceId];
                const missingDeps = dependencies.filter(
                  (dep) => !project.services[dep]
                );

                return (
                  <label
                    key={serviceId}
                    className={`
                      flex items-start gap-2 p-2.5 rounded-xl cursor-pointer
                      transition-all duration-200 ease-out
                      ${
                        enabled
                          ? 'bg-gray-700/80 shadow-md shadow-black/10'
                          : 'bg-gray-800/50 shadow-sm hover:bg-gray-700/50 hover:shadow-md'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggle(serviceId, enabled)}
                      className="mt-0.5 rounded-lg text-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-gray-800 bg-gray-700 border-gray-600 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="font-medium text-white text-sm">
                          {service.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {service.description}
                      </div>
                      {dependencies.length > 0 && !enabled && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">Requires:</span>
                          {dependencies.slice(0, 3).map((dep) => (
                            <span
                              key={dep}
                              className={`text-xs px-2 py-0.5 rounded-full shadow-sm ${
                                missingDeps.includes(dep)
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-green-900/30 text-green-400'
                              }`}
                            >
                              {serviceMetadata[dep].name}
                            </span>
                          ))}
                          {dependencies.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{dependencies.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
