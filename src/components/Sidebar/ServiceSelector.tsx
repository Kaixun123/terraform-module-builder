import { useProjectStore } from '../../stores/projectStore';
import { SERVICE_METADATA, SERVICE_CATEGORIES, DEPENDENCY_GRAPH } from '../../constants';
import { AZURE_SERVICE_METADATA, AZURE_SERVICE_CATEGORIES, AZURE_DEPENDENCY_GRAPH } from '../../constants/azure/dependencies';
import type { ServiceType } from '../../types';

export default function ServiceSelector() {
  const { project, toggleService, isServiceEnabled, getServiceDependents } = useProjectStore();

  const isAzure = project.provider === 'azure';
  const serviceMetadata = isAzure ? AZURE_SERVICE_METADATA : SERVICE_METADATA;
  const serviceCategories = isAzure ? AZURE_SERVICE_CATEGORIES : SERVICE_CATEGORIES;
  const dependencyGraph = isAzure ? AZURE_DEPENDENCY_GRAPH : DEPENDENCY_GRAPH;

  const handleToggle = (service: ServiceType, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      const dependents = getServiceDependents(service);
      if (dependents.length > 0) {
        const dependentNames = dependents.map((d) => serviceMetadata[d].name).join(', ');
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
      <h2 className="section-label mb-3">{isAzure ? 'Azure Services' : 'AWS Services'}</h2>
      <div className="space-y-5">
        {serviceCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 px-0.5">
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.services.map((serviceId) => {
                const service = serviceMetadata[serviceId];
                const enabled = isServiceEnabled(serviceId);
                const dependencies = dependencyGraph[serviceId];
                const missingDeps = dependencies.filter((dep) => !project.services[dep]);

                return (
                  <label
                    key={serviceId}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      enabled
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggle(serviceId, enabled)}
                      className="check-field mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className={`text-sm font-medium ${enabled ? 'text-blue-800' : 'text-gray-800'}`}>
                          {service.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {service.description}
                      </div>
                      {dependencies.length > 0 && !enabled && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-[10px] text-gray-400">Needs:</span>
                          {dependencies.slice(0, 3).map((dep) => (
                            <span
                              key={dep}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                missingDeps.includes(dep)
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {serviceMetadata[dep].name}
                            </span>
                          ))}
                          {dependencies.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{dependencies.length - 3}</span>
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
