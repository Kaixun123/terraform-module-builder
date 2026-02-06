import { useProjectStore } from '../../stores/projectStore';
import { getTemplatesByProvider } from '../../constants/templates';

export default function TemplateSelector() {
  const { project, selectedTemplate, loadTemplate } = useProjectStore();
  const templates = getTemplatesByProvider(project.provider || 'aws');

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Templates
      </h2>
      <div className="space-y-2">
        {templates.map((template) => (
          <label
            key={template.id}
            className={`
              flex items-start gap-3 p-3 rounded-xl cursor-pointer
              transition-all duration-200 ease-out
              ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : 'bg-gray-700/50 shadow-md shadow-black/10 hover:bg-gray-700/80 hover:shadow-lg hover:scale-[1.01]'
              }
            `}
          >
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={selectedTemplate === template.id}
              onChange={() => loadTemplate(template.id)}
              className="mt-1 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm">
                {template.name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {template.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
