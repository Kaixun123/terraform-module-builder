import { useProjectStore } from '../../stores/projectStore';
import { SERVICE_METADATA, SERVICE_CATEGORIES, DEPENDENCY_GRAPH } from '../../constants';
import type { ServiceType } from '../../types';

export default function ServiceSelector() {
  const { project, toggleService, isServiceEnabled, getServiceDependents } =
    useProjectStore();

  const handleToggle = (service: ServiceType, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      // Check if any dependents would be affected
      const dependents = getServiceDependents(service);
      if (dependents.length > 0) {
        const dependentNames = dependents
          .map((d) => SERVICE_METADATA[d].name)
          .join(', ');
        const confirmed = window.confirm(
          `Disabling ${SERVICE_METADATA[service].name} will also disable: ${dependentNames}. Continue?`
        );
        if (!confirmed) return;
      }
    }
    toggleService(service, !currentlyEnabled);
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        AWS Services
      </h2>
      <div className="space-y-4">
        {SERVICE_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.services.map((serviceId) => {
                const service = SERVICE_METADATA[serviceId];
                const enabled = isServiceEnabled(serviceId);
                const dependencies = DEPENDENCY_GRAPH[serviceId];
                const missingDeps = dependencies.filter(
                  (dep) => !project.services[dep]
                );

                return (
                  <label
                    key={serviceId}
                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      enabled
                        ? 'bg-gray-700 border border-gray-600'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggle(serviceId, enabled)}
                      className="mt-0.5 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800 bg-gray-700 border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
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
                              className={`text-xs px-1 py-0.5 rounded ${
                                missingDeps.includes(dep)
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-green-900/30 text-green-400'
                              }`}
                            >
                              {SERVICE_METADATA[dep].name}
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
